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

const cosineSimilarity = cosineSimilarityPkg
const vectorDB = JSON.parse(fs.readFileSync('./data/vector_db.json', 'utf8'))

// 🧠 Connect to Ollama Mistral endpoint
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL || 'mistral'

// 🔍 Vector similarity search
async function retrieveRelevantChunks(userQuery, topN = 3) {
  const queryVec = await embed(userQuery)
  const scored = vectorDB.map(item => ({
    ...item,
    score: cosineSimilarity(queryVec, item.embedding),
  }))
  return scored.sort((a, b) => b.score - a.score).slice(0, topN)
}

// 💬 Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    const lower = message.toLowerCase()

    // 🤝 Casual replies
    const greetings = ['hi', 'hello', 'hey', 'how are you', 'what’s up']
    if (greetings.some(g => lower.includes(g))) {
      return res.json({ reply: `Hey there! I'm Dhigin's AI assistant. Ask me anything! 🚀` })
    }

    // 📚 Context retrieval
    let context = ''
    const isProjectQuery = ['project', 'built', 'developed', 'created', 'system'].some(w =>
      lower.includes(w)
    )

    if (isProjectQuery) {
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

    const prompt = `
You are Dhigin's personal AI portfolio assistant.

Use the following context to answer the user's question clearly and informatively.
Even if the exact answer is not in the context, respond with the most relevant info.

If the user asks about projects, format the answer like:

**Project Title:** Short description here.

Leave two line breaks between each.

---
Context:
${context}
---
User's question: ${message}

Answer:
`

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: MODEL,
      prompt: prompt,
      stream: false,
    })

    const reply = response.data?.response?.trim()
    console.log('📩 User:', message)
    console.log('📚 Context:', context)
    console.log('🤖 Ollama reply:', reply)

    res.json({ reply: reply || "🤖 No response from Ollama." })
  } catch (err) {
    console.error('❌ Ollama backend error:', err.message)
    res.status(500).json({ error: '❌ Ollama API error. Try again.' })
  }
})

app.listen(3001, () => {
  console.log('🧠 Ollama RAG backend running at http://localhost:3001')
})
