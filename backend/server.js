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

// 🧠 In-memory session map (resettable or replace with Redis for prod)
const sessionGreetingMap = new Map()

// ✅ Health check
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
} catch {
  console.warn('⚠️ vector_db.json not found. Run buildVectorDB() first.')
}

// 📄 Load personal data
let personalData = []
try {
  personalData = JSON.parse(fs.readFileSync('./data/portfolio.json', 'utf8'))
} catch {
  console.warn('⚠️ portfolio.json not found. Add Dhigin\'s data.')
}

// 🔍 Vector search
async function retrieveRelevantChunks(userQuery, topN = 3) {
  const queryVec = await embed(userQuery)
  return getSimilarChunks(queryVec, vectorDB, topN)
}

// 🤖 Main chat route
app.post('/chat', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body
    const lower = message.toLowerCase()

    // 🗣 Say hi only once per session
    let greetingReply = ''
    const greetings = ['hi', 'hello', 'hey', 'yo']
    const hasGreeting = greetings.some(g => lower.includes(g))
    if (hasGreeting && !sessionGreetingMap.get(sessionId)) {
      greetingReply = "Hey there! I'm Dhigin's AI assistant. 😊 Here's what I found:\n\n"
      sessionGreetingMap.set(sessionId, true)
    }

    // 🧠 Context building
    const keywords = ['project', 'built', 'developed', 'created', 'system']
    const isProjectQuery = keywords.some(word => lower.includes(word))

    let context = ''
    if (isProjectQuery) {
      const filtered = personalData.filter(t =>
        keywords.some(w => t.toLowerCase().includes(w))
      )
      context = filtered.join('\n\n')
    } else {
      context = personalData.join('\n\n')
    }

    // 🔎 Fallback to vector chunks if needed
    if (!context.trim()) {
      const topChunks = await retrieveRelevantChunks(message)
      context = topChunks.map(c => c.text).join('\n\n')
    }

    const prompt = `
You are Dhigin's AI portfolio assistant — professional, accurate, and sharp.

Answer the question using the provided context.

If the question is about Dhigin's background, education, location, or experience, and it exists in the context, respond confidently.

If the context does not contain the answer, say: "That information isn't available in my current knowledge. Please update the data if needed."

If the question is about projects, format your reply like:

**Project Title:** Description.

Separate each project with two line breaks.

Be clear, brief, and professional.

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

// 🚀 Start server
app.listen(3001, () => {
  console.log('🧠 Gemini RAG backend running at http://localhost:3001')
})
