import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { embed } from './embedUtils.js'
import cosineSimilarityPkg from 'cosine-similarity'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const chatModel = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
})

const cosineSimilarity = cosineSimilarityPkg
const vectorDB = JSON.parse(fs.readFileSync('./data/vector_db.json', 'utf8'))

async function retrieveRelevantChunks(userQuery, topN = 3) {
  const queryVec = await embed(userQuery)
  const scored = vectorDB.map(item => ({
    ...item,
    score: cosineSimilarity(queryVec, item.embedding),
  }))
  return scored.sort((a, b) => b.score - a.score).slice(0, topN)
}

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    const lower = message.toLowerCase()
    const casualPhrases = ['hi', 'hello', 'hey', 'how are you']

    let context = ''

    if (casualPhrases.some(p => lower.includes(p))) {
      context = `You're a friendly assistant for Dhigin's AI portfolio.`
    } else {
      const isProjectQuery = ['project', 'built', 'created'].some(p => lower.includes(p))
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
    }

    const prompt = `
You are Dhigin's AI portfolio assistant. Use the context below to answer user queries with relevant details from his experience. 

If the query is about projects, respond with:
**Project Title:** Description

Avoid saying "I don't know". Always try your best.

---
Context:
${context}
---
User question: ${message}
`

    const chat = await chatModel.startChat({
      history: [],
      generationConfig: {
        temperature: 0.7,
      },
    })

    const result = await chat.sendMessage(prompt)
    const reply = result.response.text()

    console.log("🔍 QUERY:", message)
    console.log("🧠 CONTEXT:", context)
    console.log("💬 Gemini Reply:", reply)

    res.json({ reply })
  } catch (err) {
    console.error("❌ Gemini-RAG ERROR:", err.message)
    res.status(500).json({ error: 'RAG backend failed.' })
  }
})

app.listen(3001, () => {
  console.log('🧠 Gemini RAG backend running at http://localhost:3001')
})
