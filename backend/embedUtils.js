import fs from 'fs'
import axios from 'axios'
import cosineSimilarityPkg from 'cosine-similarity'

const cosineSimilarity = cosineSimilarityPkg

/**
 * Generate embedding using Ollama
 */
export async function embed(text) {
  const response = await axios.post('http://localhost:11434/api/embeddings', {
    model: 'nomic-embed-text',
    prompt: text
  })

  return response.data.embedding
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
