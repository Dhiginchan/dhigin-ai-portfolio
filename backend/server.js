import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { embed, getSimilarChunks } from './embedUtils.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// ✅ Health check endpoint
app.get('/ping', (req, res) => {
  res.status(200).send('✅ Gemini RAG is awake!')
})

// ⚙️ Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const chatModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' })

// 📚 Load vector DB
let vectorDB = []
try {
  vectorDB = JSON.parse(fs.readFileSync('./data/vector_db.json', 'utf8'))
} catch (e) {
  console.warn('⚠️ vector_db.json not found. Run buildVectorDB() first.')
}

// 🔍 Vector search
async function retrieveRelevantChunks(userQuery, topN = 3) {
  const queryVec = await embed(userQuery)
  return getSimilarChunks(queryVec, vectorDB, topN)
}

// 🤖 Main chat route
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    const lower = message.toLowerCase()

    // 💬 Friendly intro injection (but never stop real answer)
    const greetings = ['hi', 'hello', 'hey', 'how are you', 'yo']
    const hasGreeting = greetings.some(g => lower.includes(g))
    const greetingReply = hasGreeting ? "Hey there! I'm Dhigin's AI assistant. 😊 Here's what I found:\n\n" : ''

    // 🧠 Build context
    let context = ''
    const keywords = ['project', 'built', 'developed', 'created', 'system']
    const isProjectQuery = keywords.some(word => lower.includes(word))

    if (isProjectQuery) {
      const all = JSON.parse(fs.readFileSync('./data/portfolio.json', 'utf8'))
      const filtered = all.filter(t =>
        keywords.some(w => t.toLowerCase().includes(w))
      )
      context = filtered.join('\n\n')
    } else {
      const topChunks = await retrieveRelevantChunks(message)
      context = topChunks.map(c => c.text).join('\n\n')
    }

    const prompt = `
You are Dhigin's AI portfolio assistant, designed to answer any questions about him with clarity and professionalism.

If the user asks about Dhigin's projects, respond in this format:

**Project Title:** Description.

Separate each project with two line breaks.

Otherwise, answer in a confident, informative tone. If you don't know something, say so clearly and politely.

---
Context:
${context}
---
User's Question: ${message}
    `.trim()

    const result = await chatModel.generateContent(prompt)
    const reply = greetingReply + result.response.text()

    console.log('🧠 Gemini RAG replied:', reply)
    res.json({ reply })
  } catch (err) {
    console.error('❌ Gemini RAG Error:', err.message || err)
    res.status(500).json({ error: 'Gemini API error. Try again.' })
  }
})

// 🚀 Launch server
app.listen(3001, () => {
  console.log('🧠 Gemini RAG backend running at http://localhost:3001')
})
