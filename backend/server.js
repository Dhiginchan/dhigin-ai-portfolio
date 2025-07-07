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

const cosineSimilarity = cosineSimilarityPkg

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const chatModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL })

// Load vector DB
const vectorDB = JSON.parse(fs.readFileSync('./data/vector_db.json', 'utf8'))

// 🔍 RAG vector search
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

    // 💬 Friendly greeting shortcut
    const casualPhrases = ['hi', 'hello', 'hey', 'how are you', 'what’s up']
    if (casualPhrases.some(p => lower.includes(p))) {
      const friendlyPrompt = `You're a friendly AI assistant for Dhigin's portfolio. Respond casually and naturally to: "${message}"`
      const result = await chatModel.generateContent([
        { role: 'user', parts: [{ text: friendlyPrompt }] }
      ])
      const reply = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || '👋 Hi!'
      return res.json({ reply })
    }

    // 📁 Project query override
    const projectKeywords = ['project', 'projects', 'built', 'system', 'developed']
    const isProjectQuery = projectKeywords.some(p => lower.includes(p))
    let context = ''

    if (isProjectQuery) {
      const all = JSON.parse(fs.readFileSync('./data/portfolio.json', 'utf8'))
      const projectChunks = all.filter(t =>
        ['project', 'built', 'developed', 'created', 'system'].some(word =>
          t.toLowerCase().includes(word)
        )
      )
      context = projectChunks.join('\n')
    } else {
      const topChunks = await retrieveRelevantChunks(message)
      context = topChunks.map(c => c.text).join('\n')
    }

    // 📜 Prompt
    const prompt = `
You are Dhigin's AI portfolio assistant.

Use the context below to answer the user's question as accurately and informatively as possible.
Even if the context doesn't contain an exact answer, try your best to respond with the **closest relevant information** from Dhigin’s portfolio.

If the user asks about projects, structure the reply like this:

**Project Title:** Short description.

Use double line breaks between each project. Do NOT merge into a paragraph.

---
Context:
${context}
---
User's Question: ${message}

Give the best helpful, concise, and professional answer.
    `.trim()

    const result = await chatModel.generateContent([
      { role: 'user', parts: [{ text: prompt }] }
    ])
    const reply = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, no response.'

    // Debug
    console.log('📝 USER:', message)
    console.log('📎 CONTEXT:', context)
    console.log('🤖 GEMINI RESPONSE:', reply)

    res.json({ reply })
  } catch (err) {
    console.error('❌ Gemini-RAG ERROR:', err.message)
    res.status(500).json({ reply: '❌ Gemini API error.' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🧠 Gemini RAG backend running at http://localhost:${PORT}`)
})
