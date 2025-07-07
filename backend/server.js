import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import cosineSimilarityPkg from 'cosine-similarity'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { embed } from './embedUtils.js'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const chatModel = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL })
const cosineSimilarity = cosineSimilarityPkg
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

    // 💬 Casual greeting replies
    const casualPhrases = ['hi', 'hello', 'hey', 'how are you', 'what’s up']
    if (casualPhrases.some(p => lower.includes(p))) {
      const friendlyPrompt = `You're a friendly AI assistant for Dhigin's portfolio. Respond naturally to: "${message}"`
      const casualRes = await chatModel.generateContent(friendlyPrompt)
      return res.json({ reply: casualRes.response.text() })
    }

    // 📁 Project-specific override
    const projectKeywords = ['project', 'projects', 'what did he build', 'work done']
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

  const prompt = `
You are Dhigin's AI portfolio assistant.

Use the context below to answer the user's question as accurately and informatively as possible. 
Even if the context doesn't contain an exact answer, try your best to respond with the **closest relevant information** based on Dhigin's portfolio.

Your job is to always help the user — never reply with "I don't know" or "not available".
Give the most helpful, intelligent answer you can based on the available data.

If the user asks about projects, structure the reply like this:

**Project Title:** Short description here.

Use two line breaks between each project. Do NOT combine all into one paragraph.

---
Context:
${context}
---
User's Question: ${message}

Respond with clear, helpful language. Keep it concise but informative.
`


    const result = await chatModel.generateContent(prompt)
    const reply = result.response.text()

    console.log("🔍 QUERY:", message)
    console.log("🧠 CONTEXT:", context)
    console.log("💬 Gemini RAG Reply:", reply)

    res.json({ reply })
  } catch (err) {
    console.error("❌ Gemini-RAG ERROR:", err.message)
    res.status(500).json({ error: 'RAG backend failed.' })
  }
})

app.listen(3001, () => {
  console.log('🧠 Gemini RAG backend running at http://localhost:3001')
})
