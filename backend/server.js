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

// 🧠 In-memory greeting tracker
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
    const lower = message.toLowerCase().trim()

    // 👋 Greeting & Farewell logic
    const greetingsOnly = ['hi', 'hello', 'hey', 'yo']
    const politeClosings = ['bye', 'ok', 'thank you', 'thanks', 'see you', 'goodbye']

    const isOnlyGreeting = greetingsOnly.includes(lower)
    const isClosing = politeClosings.some(p => lower.includes(p))

    if (isClosing) {
      return res.json({ reply: "You're welcome! Have a great day! 😊" })
    }

    if (isOnlyGreeting) {
      return res.json({ reply: "Hello. How can I assist you today?" })
    }

    // ⛔️ Prevent multiple "Hey" intros
    let greetingReply = ''
    const startsWithGreeting = greetingsOnly.some(g => lower.startsWith(g))
    if (startsWithGreeting && !sessionGreetingMap.get(sessionId)) {
      sessionGreetingMap.set(sessionId, true) // mark greeting done
      greetingReply = '' // Skip greeting if question exists
    }

    // 🧠 Context build logic
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

    // 🔄 Fallback to vector search if context empty
    if (!context.trim()) {
      const topChunks = await retrieveRelevantChunks(message)
      context = topChunks.map(c => c.text).join('\n\n')
    }

    const prompt = `
You are Dhigin's AI portfolio assistant — professional, accurate, and helpful.

Use the context below to answer the user's question.

If the question is about Dhigin's background, education, location, experience, or skills — and the context has it — answer confidently.

If the context doesn't have the answer, say: "That information isn't available in my current knowledge. Please update the data if needed."

If the question is about projects, format like this:

**Project Title:** Description.

Separate each project with two line breaks.

Be clear, professional, and avoid repeating greetings or filler.

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
