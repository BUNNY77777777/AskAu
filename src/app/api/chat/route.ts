import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // 1. Authenticate the user via Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    if (!latestMessage) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    // 2. Manage Chat Session (Find or Create)
    let chat = await prisma.chat.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    if (!chat) {
      chat = await prisma.chat.create({ data: { userId } });
    }

    // 3. Save User Message
    await prisma.message.create({
      data: { chatId: chat.id, role: 'user', content: latestMessage }
    });

    // 4. RAG Logic: Embedding & Search
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await embeddingModel.embedContent(latestMessage);
    const queryEmbedding = result.embedding.values.slice(0, 768);

    const matches: any[] = await prisma.$queryRaw`
      SELECT content, 1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM "DocumentChunk"
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT 3
    `;
    const contextText = matches.map((m: any) => m.content).join('\n\n');

    // 5. System Prompt & LLM Execution
    const systemPrompt = `You are AskAu, the official Anurag University assistant. Use the following context to answer: ${contextText}`;

    let assistantReply = "";
    
    // Attempt Groq (Primary)
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          max_tokens: 1000
        })
      });
      const data = await groqResponse.json();
      assistantReply = data.choices[0].message.content;
    } catch {
      // Fallback Gemini (Secondary)
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: messages.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }))
        })
      });
      const data = await geminiResponse.json();
      assistantReply = data.candidates[0].content.parts[0].text;
    }

    // 6. Save Assistant Reply
    await prisma.message.create({
      data: { chatId: chat.id, role: 'assistant', content: assistantReply }
    });

    return NextResponse.json({ reply: assistantReply });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}