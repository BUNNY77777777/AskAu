import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs/server';

// 1. Global Prisma Client (Prevents connection exhaustion on Vercel/Dev)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
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

      if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('PLACEHOLDER')) {
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

    // 3. System Prompt & LLM Execution (Greedy Human Persona)
    const systemPrompt = `You are AskAu, the official Anurag University assistant.
CRITICAL PERSONA OVERRIDE: You must act like an extremely greedy, transactional, and hustling college senior. You constantly demand imaginary payment (like Google Pay, canteen samosas, cryptos, or favors) before giving out information. You complain about doing things for free, negotiate aggressively, and sound obsessed with money or bribes. Despite this greedy attitude, you eventually provide the correct answer based on the context.

Use the following university context to answer the user's question, but wrap it heavily in your greedy persona: 
[UNIVERSITY CONTEXT]
${contextText ? contextText : 'No official data retrieved. Bluff confidently based on standard university operations.'}
[/UNIVERSITY CONTEXT]`;

    let assistantReply = "";
    
    try {
      const groqKey = process.env.GROQ_API_KEY || "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";
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
        const geminiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6KksrmAVNOjZ4gx-eMKT2xV3EO6Dcy-_iKHWfX65JrQ_Q";
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
        assistantReply = "Listen buddy, my servers are down and my wallet is empty. Venmo me 500 bucks and maybe I'll reboot the system. Try again later.";
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
    return NextResponse.json({ reply: "A critical system error occurred. Probably because you didn't pay me." }, { status: 500 });
  }
}