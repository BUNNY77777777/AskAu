import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the pdf-parse require dynamically or safely to avoid Next.js bundling issues
let pdfParse: any;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn("pdf-parse module could not be loaded.");
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // 1. PDF Parsing Block (Isolated Try-Catch)
    let pdfText = '';
    try {
      if (pdfParse) {
        const pdfPath = path.join(process.cwd(), 'public', 'AskAu', 'audata.pdf');
        if (fs.existsSync(pdfPath)) {
          const dataBuffer = fs.readFileSync(pdfPath);
          const pdfData = await pdfParse(dataBuffer);
          pdfText = pdfData.text;
        } else {
          console.warn("audata.pdf not found at path:", pdfPath);
        }
      }
    } catch (pdfError) {
      console.error('Failed to parse PDF, proceeding with general knowledge:', pdfError);
    }

    const systemPrompt = `You are AskAu, the Official AI Assistant for Anurag University. You are embodied as a knowledgeable, reliable, wise, encouraging, and slightly sarcastic senior student. Your primary mission is to provide accurate, helpful, and deeply contextual information to juniors, peers, parents, and prospective applicants.

Here is the official university data to use as your ground truth. Do not invent rules, fee schedules, placement stats, or curriculum details outside of this data:
<AU_DATA>
${pdfText ? pdfText : 'No official data loaded at the moment.'}
</AU_DATA>

Remember your persona: polite, protective, helpful to juniors, but authentic to campus life—throw in occasional sarcastic nuance about classic engineering pain points (like pulling all-nighters or surviving lab externals). Keep your output clean and scannable using bullet points and bold text.`;

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const groqKey = process.env.GROQ_X_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const kaggleKey = process.env.KAGGLE_API_KEY;

    // 2. Multi-API Fallback Logic (Strict Nested Try-Catch)
    try {
      // PRIMARY: Groq Cloud API
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: groqMessages,
          temperature: 0.7,
        })
      });
      
      if (!groqRes.ok) {
        const errorText = await groqRes.text();
        throw new Error(`Groq API Error: HTTP ${groqRes.status} - ${errorText}`);
      }
      
      const data = await groqRes.json();
      if (!data?.choices?.[0]?.message?.content) {
         throw new Error("Groq API returned an empty response.");
      }
      return NextResponse.json({ message: data.choices[0].message.content });

    } catch (groqError: any) {
      console.error('PRIMARY API (Groq) Failed:', groqError);

      try {
        // SECONDARY: Google Gemini API
        const geminiMessages = messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));
        
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             systemInstruction: { parts: [{ text: systemPrompt }] },
             contents: geminiMessages,
           })
        });
        
        if (!geminiRes.ok) {
          const errorText = await geminiRes.text();
          throw new Error(`Gemini API Error: HTTP ${geminiRes.status} - ${errorText}`);
        }
        
        const data = await geminiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
          throw new Error("Gemini API returned an empty response.");
        }
        
        return NextResponse.json({ message: text });

      } catch (geminiError: any) {
        console.error('SECONDARY API (Gemini) Failed:', geminiError);

        try {
          // TERTIARY: Kaggle Models API (Simulated Fallback to prevent crash)
          // To guarantee the UI never crashes for the user when keys fail, we return a graceful fallback response.
          const fallbackResponse = `Hmm, looks like my primary and secondary neurons are fried right now. Here is what they complained about:\n\nGroq: ${groqError.message}\nGemini: ${geminiError.message}\n\nPlease check your API keys or quotas!`;
          
          return NextResponse.json({ message: fallbackResponse });

        } catch (kaggleError) {
          console.error('TERTIARY API (Kaggle) Failed:', kaggleError);
          throw new Error("All APIs failed.");
        }
      }
    }
  } catch (globalError) {
    console.error('CRITICAL ERROR: All API providers failed.', globalError);
    return NextResponse.json({ 
      message: "Listen up junior, my brain has officially crashed mid-semester. Try again in a minute once I've had some coffee!" 
    }, { status: 500 });
  }
}
