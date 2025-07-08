import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import axios from 'axios'
import cosineSimilarityPkg from 'cosine-similarity'
import { embed } from './embedUtils.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// ✅ Ollama endpoint config
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL || 'mistral'

const cosineSimilarity = cosineSimilarityPkg
const vectorDB = JSON.parse(fs.readFileSync('./data/vector_db.json', 'utf8'))

// 🔍 Vector search using cosine similarity
async function retrieveRelevantChunks(userQuery, topN = 3) {
  const queryVec = await embed(userQuery)
  const scored = vectorDB.map((item) => ({
    ...item,
    score: cosineSimilarity(queryVec, item.embedding),
  }))
  return scored.sort((a, b) => b.score - a.score).slice(0, topN)
}

// 🤖 Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    const lower = message.toLowerCase()

    // 👋 Friendly greeting shortcut
    const greetings = ['hi', 'hello', 'hey', 'how are you', 'yo']
    if (greetings.some((g) => lower.includes(g))) {
      return res.json({
        reply: "Hey there! I'm Dhigin's AI assistant. Ask me anything! 🚀",
      })
    }

    // 🔍 Build RAG context
    let context = ''
    const keywords = ['project', 'built', 'developed', 'created', 'system']
    const isProjectQuery = keywords.some((word) => lower.includes(word))

    if (isProjectQuery) {
      const all = JSON.parse(fs.readFileSync('./data/portfolio.json', 'utf8'))
      const filtered = all.filter((t) =>
        keywords.some((w) => t.toLowerCase().includes(w))
      )
      context = filtered.join('\n\n')
    } else {
      const topChunks = await retrieveRelevantChunks(message)
      context = topChunks.map((c) => c.text).join('\n\n')
    }

    // 💡 Final prompt
    const prompt = `
You are Dhigin's AI assistant.

Use the context below to answer the user's question. If it asks about projects, structure replies like this:

**Project Title:** Short description.

Add two line breaks between each project.

---
Context:
${context}
---
User's Question: ${message}
`.trim()

    // 🔁 Call Ollama
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL,
      prompt: prompt,
      stream: false,
    })

    console.log('🧠 RAW Ollama Response:', response.data)

    const reply = response.data?.response?.trim() || "🤖 Ollama didn’t reply."

    res.json({ reply })
  } catch (err) {
    console.error('❌ Ollama backend error:', err.message || err)
    res.status(500).json({ error: 'Ollama API error. Try again.' })
  }
})

// 🚀 Start server
app.listen(3001, () => {
  console.log('🧠 Ollama RAG backend running at http://localhost:3001')
})
