import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Simple chunking function (approx 1000 chars, 200 overlap)
function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

async function main() {
  console.log('Starting ingestion...');
  
  // Read the plain text file directly
  const textPath = path.join(process.cwd(), 'public', 'AskAu', 'audata.txt');
  const text = fs.readFileSync(textPath, 'utf-8');
  
  console.log(`Extracted ${text.length} characters from TXT.`);
  const chunks = chunkText(text);
  console.log(`Split into ${chunks.length} chunks.`);
  
  await prisma.$executeRaw`TRUNCATE TABLE "DocumentChunk" RESTART IDENTITY;`;
  
  // FIX: Use the actual active 2026 model
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    try {
      const result = await model.embedContent(chunk);
      
      // FIX: Slice the 3072D vector down to 768D so it fits your Supabase schema
      const embedding = result.embedding.values.slice(0, 768);
      
      // Store in Supabase via raw SQL
      await prisma.$executeRaw`
        INSERT INTO "DocumentChunk" (id, content, embedding)
        VALUES (
          gen_random_uuid()::text,
          ${chunk},
          ${embedding}::vector
        )
      `;
      console.log(`Embedded and stored chunk ${i + 1}/${chunks.length}`);
    } catch (e) {
      console.error(`Failed to embed chunk ${i + 1}`, e);
    }
  }
  console.log('Ingestion complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });