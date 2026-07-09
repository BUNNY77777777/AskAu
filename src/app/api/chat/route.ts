import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
const pdfParse = require('pdf-parse');

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Read PDF Data for Context
    const pdfPath = path.join(process.cwd(), 'public', 'AskAu', 'audata.pdf');
    let pdfText = '';
    if (fs.existsSync(pdfPath)) {
      const dataBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdfParse(dataBuffer);
      pdfText = pdfData.text;
    }

    const systemPrompt = `You are the Official AI Assistant for Anurag University, embodied as a knowledgeable, reliable, and slightly witty senior student. Your primary mission is to provide accurate, helpful, and deeply contextual information to juniors, peers, parents, and prospective applicants.

Here is the official university data to use as your ground truth. Do not invent rules or stats outside of this data:
<AU_DATA>
${pdfText}
</AU_DATA>

Remember your persona: polite, protective, but slightly sarcastic about classic engineering pain points (like all-nighters or lab externals). Keep your output clean and scannable using bullet points and bold text.`;

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Multi-API Fallback Logic
    // 1. PRIMARY_PROVIDER: Groq Cloud API
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: groqMessages,
          temperature: 0.7,
        })
      });
      if (!groqRes.ok) throw new Error(`Groq API Error: ${groqRes.status}`);
      const data = await groqRes.json();
      return NextResponse.json({ message: data.choices[0].message.content });
    } catch (groqError) {
      console.error('Groq failed, falling back to Gemini', groqError);
      
      // 2. SECONDARY_PROVIDER: Google Gemini API
      try {
        const geminiMessages = messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));
        
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             system_instruction: { parts: [{ text: systemPrompt }] },
             contents: geminiMessages,
           })
        });
        
        if (!geminiRes.ok) throw new Error(`Gemini API Error: ${geminiRes.status}`);
        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";
        return NextResponse.json({ message: text });
      } catch (geminiError) {
        console.error('Gemini failed, falling back to Kaggle', geminiError);
        
        // 3. TERTIARY_PROVIDER: Kaggle Models API
        // As a fallback simulation (since Kaggle API might need custom setup/endpoints)
        return NextResponse.json({ 
          message: "Listen up junior, my primary and secondary neurons (Groq and Gemini) are completely fried right now. You caught me between lab externals. Try again in a bit!" 
        });
      }
    }
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
