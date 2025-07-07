import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import { GoogleGenerativeAI } from '@google/generative-ai'
import cosineSimilarityPkg from 'cosine-similarity'
import { embed } from './embedUtils.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const chatModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL })
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

// 💬 Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    const lower = message.toLowerCase()

    // 🤝 Friendly greetings
    const greetings = ['hi', 'hello', 'hey', 'how are you', 'what’s up']
    if (greetings.some(g => lower.includes(g))) {
      const prompt = `You're Dhigin's friendly AI portfolio assistant. Greet the user warmly. User said: "${message}"`
      const result = await chatModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
      return res.json({ reply: result.response.text() })
    }

    // 🧠 Pull RAG context
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

    // 🧠 Construct final prompt
    const prompt = `
You are Dhigin's personal AI portfolio assistant.

Use the context below to answer the user's question clearly and informatively. 
Never say "I don't know." Respond with the best available info about Dhigin.

If the user asks about projects, format the answer like this:

**Project Title:** Description here.

(Include two line breaks between each.)

---
Context:
${context}
---
User's question: ${message}
`

    const result = await chatModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
    const reply = result.response.text()

    console.log('🔍 User:', message)
    console.log('📚 Context:', context)
    console.log('🤖 Gemini reply:', reply)

    res.json({ reply })
  } catch (err) {
    console.error('❌ Gemini-RAG ERROR:', err)
    res.status(500).json({ error: 'Gemini RAG backend failed.' })
  }
})

// ✅ Start server
app.listen(3001, () => {
  console.log('🧠 Gemini RAG backend running at http://localhost:3001')
})
