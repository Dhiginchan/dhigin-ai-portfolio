import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import axios from 'axios'
import { embed } from './embedUtils.js'
import cosineSimilarityPkg from 'cosine-similarity'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const OLLAMA_URL = process.env.OLLAMA_API_URL
const MODEL = process.env.OLLAMA_MODEL
const cosineSimilarity = cosineSimilarityPkg

// Load vector DB
const vectorDB = JSON.parse(fs.readFileSync('./data/vector_db.json', 'utf8'))

// 🔍 Vector similarity search
async function retrieveRelevantChunks(userQuery, topN = 3) {
  const queryVec = await embed(userQuery)
  const scored = vectorDB.map(item => ({
    ...item,
    score: cosineSimilarity(queryVec, item.embedding)
  }))
  return scored.sort((a, b) => b.score - a.score).slice(0, topN)
}

// 🧠 Send prompt to Ollama
async function queryOllama(prompt) {
  const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model: MODEL,
    prompt,
    stream: false
  })
  return response.data.response
}

// 💬 Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    const lower = message.toLowerCase()

    // Friendly reply
    const greetings = ['hi', 'hello', 'hey', 'how are you', 'what’s up']
    if (greetings.some(g => lower.includes(g))) {
      const prompt = `You're a friendly AI assistant for Dhigin's portfolio. Greet the user based on: "${message}"`
      const reply = await queryOllama(prompt)
      return res.json({ reply })
    }

    // Context search
    let context = ''
    const projectQuery = ['project', 'built', 'developed', 'created', 'system'].some(word => lower.includes(word))

    if (projectQuery) {
      const all = JSON.parse(fs.readFileSync('./data/portfolio.json', 'utf8'))
      const projectChunks = all.filter(t =>
        ['project', 'built', 'developed', 'created', 'system'].some(word =>
          t.toLowerCase().includes(word)
        )
      )
      context = projectChunks.join('\n\n')
    } else {
      const topChunks = await retrieveRelevantChunks(message)
      context = topChunks.map(c => c.text).join('\n\n')
    }

    const finalPrompt = `
You are Dhigin's AI assistant.

Use the context below to answer the user's question as clearly and informatively as possible.

If the user asks about projects, format the answer like:

**Project Title:** Description

(use double line breaks between each)

---
Context:
${context}
---
User's question: ${message}
    `.trim()

    const reply = await queryOllama(finalPrompt)

    console.log('💬 Question:', message)
    console.log('📚 Context:', context)
    console.log('🤖 Ollama reply:', reply)

    res.json({ reply })
  } catch (err) {
    console.error('❌ Ollama backend error:', err.message)
    res.status(500).json({ error: 'Ollama RAG backend failed.' })
  }
})

app.listen(3001, () => {
  console.log('🧠 Ollama RAG backend running at http://localhost:3001')
})
