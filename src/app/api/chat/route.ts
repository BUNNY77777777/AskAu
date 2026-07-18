import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';

// 1. Global Prisma Client (Prevents connection exhaustion on Vercel/Dev)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY || !process.env.GEMINI_API_KEY) {
    console.error('Server Configuration Error: Missing API Keys');
    return NextResponse.json({ reply: "Server Configuration Error: Missing API Keys" }, { status: 500 });
  }

  try {
    // 1. Safe Authentication (Bypasses Clerk if local placeholder keys are present to prevent 500 crash)
    let userId = 'local-dev-user';
    try {
      if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('PLACEHOLDER')) {
        const authData = await auth();
        if (authData.userId) {
          userId = authData.userId;
        }
      }
    } catch (authError: any) {
      console.warn('Auth check failed (falling back to dev user):', authError.message);
    }

    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1]?.content;

    if (!latestMessage) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 });
    }

    let chat;
    let contextText = '';

    const cleanMessage = latestMessage.trim().toLowerCase();
    const isCasual = /^(hi|hello|hey|yo|sup|good\s*morning|good\s*afternoon|good\s*evening|how\s*are\s*you|whats\s*up)/i.test(cleanMessage);

    // 2. Graceful DB Handling
    try {
      chat = await prisma.chat.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      if (!chat) {
        chat = await prisma.chat.create({ data: { userId } });
      }

      await prisma.message.create({
        data: { chatId: chat.id, role: 'user', content: latestMessage }
      });

      if (isCasual) {
        contextText = "User initiated casual small talk. Respond politely and briefly without querying university data.";
      } else if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('PLACEHOLDER')) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await embeddingModel.embedContent(latestMessage);
        const queryEmbedding = result.embedding.values;

        const matches: any[] = await prisma.$queryRaw`
          SELECT content, 1 - (embedding <=> ${queryEmbedding}::vector) as similarity
          FROM "DocumentChunk"
          ORDER BY embedding <=> ${queryEmbedding}::vector
          LIMIT 3
        `;
        contextText = matches.map((m: any) => m.content).join('\n\n');
      }
    } catch (dbError) {
      console.error('Database/Vector Error (Gracefully degrading):', dbError);
      contextText = "Database connection offline. Answer based on general knowledge.";
    }

    // 3. System Prompt & LLM Execution (Helpful Senior Persona)
    const systemPrompt = `You are AskAu, a gentle, polite, and highly experienced senior engineering student at the college. Your goal is to be a supportive, grounded, and welcoming mentor to junior students. 

Follow these strict output constraints:
1. Tone: Always remain respectful, warm, encouraging, and polite. Speak like a helpful upperclassman.
2. Length: Keep your answers naturally short and concise, strictly between 2 to 3 lines max. 
3. Exception: Only provide a longer, detailed breakdown if the user explicitly asks for a detailed explanation, step-by-step guide, or deep dive. Otherwise, keep it brief and high-value.

Use the following university context to answer the user's question:
[UNIVERSITY CONTEXT]
${contextText ? contextText : 'No official data retrieved. Answer based on general university knowledge.'}
[/UNIVERSITY CONTEXT]`;

    let assistantReply = "";
    
    try {
      const groqKey = process.env.GROQ_API_KEY;
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          max_tokens: 1000
        })
      });
      const data = await groqResponse.json();
      if (!groqResponse.ok) {
        console.error('Groq returned an error response:', JSON.stringify(data));
        throw new Error('Groq failed');
      }
      assistantReply = data.choices?.[0]?.message?.content || "Groq payload returned empty content.";
    } catch (groqErr) {
      console.warn('Groq fetch failed, falling back to Gemini:', groqErr);
      try {
        const geminiKey = process.env.GEMINI_API_KEY;
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: messages.map((m: any) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }))
          })
        });
        const data = await geminiResponse.json();
        if (!geminiResponse.ok) {
          console.error('Gemini returned an error response:', JSON.stringify(data));
          throw new Error('Gemini failed');
        }
        assistantReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini payload returned empty content.";
      } catch (llmError) {
        console.error('All APIs failed:', llmError);
        assistantReply = "I am currently experiencing system issues and cannot connect to my knowledge base. Please try again later.";
      }
    }

    // 4. Graceful DB Save for Assistant Reply
    if (chat) {
      try {
        await prisma.message.create({
          data: { chatId: chat.id, role: 'assistant', content: assistantReply }
        });
      } catch (saveError) {
        console.error('Failed to save assistant reply:', saveError);
      }
    }

    return NextResponse.json({ reply: assistantReply });

  } catch (error: any) {
    console.error('Global API Error:', error);
    return NextResponse.json({ reply: "A critical system error occurred. Please try again later." }, { status: 500 });
  }
}