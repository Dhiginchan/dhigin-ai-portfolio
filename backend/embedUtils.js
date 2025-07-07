import fs from 'fs'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'
import cosineSimilarityPkg from 'cosine-similarity'

const cosineSimilarity = cosineSimilarityPkg
dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const embedModel = genAI.getGenerativeModel({ model: 'models/embedding-001' })

/**
 * Generate embedding for a single chunk of text
 */
export async function embed(text) {
  const result = await embedModel.embedContent({
    content: text,
    taskType: 'retrieval_document',
    title: 'resume_chunk',
  })

  return result.embedding.values
}

/**
 * Build the vector DB from portfolio.json
 */
export async function buildVectorDB() {
  const raw = fs.readFileSync('./data/portfolio.json', 'utf8')
  const docs = JSON.parse(raw)

  const embeddedDocs = await Promise.all(
    docs.map(async (text) => ({
      text,
      embedding: await embed(text),
    }))
  )

  fs.writeFileSync('./data/vector_db.json', JSON.stringify(embeddedDocs, null, 2))
  console.log('✅ Vector DB built and saved.')
}

/**
 * Perform cosine similarity search
 */
export function getSimilarChunks(queryVec, allChunks, topN = 3) {
  const scored = allChunks.map((item) => ({
    ...item,
    score: cosineSimilarity(queryVec, item.embedding),
  }))

  return scored.sort((a, b) => b.score - a.score).slice(0, topN)
}
