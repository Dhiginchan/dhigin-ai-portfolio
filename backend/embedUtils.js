import fs from 'fs'
import axios from 'axios'
import cosineSimilarityPkg from 'cosine-similarity'
import dotenv from 'dotenv'

dotenv.config()

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const cosineSimilarity = cosineSimilarityPkg

export async function embed(text) {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
      model: 'nomic-embed-text',
      prompt: text
    }, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    })

    if (!response.data || !response.data.embedding) {
      throw new Error('Invalid embedding response')
    }

    return response.data.embedding
  } catch (err) {
    console.error('❌ Embed error:', err.message)
    throw err
  }
}

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

export function getSimilarChunks(queryVec, allChunks, topN = 3) {
  const scored = allChunks.map((item) => ({
    ...item,
    score: cosineSimilarity(queryVec, item.embedding),
  }))

  return scored.sort((a, b) => b.score - a.score).slice(0, topN)
}
