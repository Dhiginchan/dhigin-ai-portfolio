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

const vectorDB = JSON.parse(fs.readFileSync('./data/vector_db.json', 'utf8'))

async function retrieveRelevantChunks(userQuery, topN = 3) {
  const queryVec = await embed(userQuery)
  const scored = vectorDB.map(item => ({
    ...item,
    score: cosineSimilarity(queryVec, item.embedding)
  }))
  return scored.sort((a, b) => b.score - a.score).slice(0, topN)
}

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    const lower = message.toLowerCase()

    const greetings = ['hi', 'hello', 'hey', 'how are you', 'what’s up']
    if (greetings.some(g => lower.includes(g))) {
      const prompt = `You're Dhigin's friendly AI assistant. Respond naturally: "${message}"`
      const chat = await chatModel.startChat()
      const result = await chat.sendMessage(prompt)
      return res.json({ reply: result.response.text() })
    }

    let context = ''
    const isProjectQuery = ['project', 'built', 'developed', 'created', 'system'].some(word => lower.includes(word))

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
You are Dhigin's intelligent AI portfolio assistant.

Below is Dhigin's portfolio context. Answer the user's question using this info.

If the user asks about projects, respond like:

**Project Title:** Short description here.

Add two line breaks between each project. If unsure, use the closest available info.

---
Context:
${context}
---
User Question: ${message}
`

    const chat = await chatModel.startChat()
    const result = await chat.sendMessage(prompt)
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

app.listen(3001, () => {
  console.log('🧠 Gemini RAG backend running at http://localhost:3001')
})
