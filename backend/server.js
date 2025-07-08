import express from 'express'
import cors from 'cors'
import fs from 'fs'
import dotenv from 'dotenv'
import axios from 'axios'
import cosineSimilarityPkg from 'cosine-similarity'
import { embed } from './embedUtils.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const cosineSimilarity = cosineSimilarityPkg
const vectorDB = JSON.parse(fs.readFileSync('./data/vector_db.json', 'utf8'))

async function queryOllama(prompt) {
  const response = await axios.post('http://localhost:11434/api/generate', {
    model: 'mistral', // or whatever model you pulled
    prompt: prompt,
    stream: false
  })
  return response.data.response
}

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

    const greetings = ['hi', 'hello', 'hey', 'how are you']
    if (greetings.some(g => lower.includes(g))) {
      const reply = await queryOllama(`Greet the user casually. User said: "${message}"`)
      return res.json({ reply })
    }

    let context = ''
    const isProjectQuery = ['project', 'built', 'developed', 'system'].some(w =>
      lower.includes(w)
    )

    if (isProjectQuery) {
      const all = JSON.parse(fs.readFileSync('./data/portfolio.json', 'utf8'))
      const chunks = all.filter(t =>
        ['project', 'built', 'developed', 'created', 'system'].some(w =>
          t.toLowerCase().includes(w)
        )
      )
      context = chunks.join('\n\n')
    } else {
      const topChunks = await retrieveRelevantChunks(message)
      context = topChunks.map(c => c.text).join('\n\n')
    }

    const prompt = `
You are Dhigin's AI portfolio assistant.

Use the context below to answer the user's question as clearly and intelligently as possible.

If the user asks about projects, format like:
**Project Title:** Description

---
Context:
${context}
---
User: ${message}
Answer:
`

    const reply = await queryOllama(prompt)
    res.json({ reply })
  } catch (err) {
    console.error('❌ Ollama ERROR:', err.message)
    res.status(500).json({ error: 'Ollama backend failed.' })
  }
})

app.listen(3001, () => {
  console.log('🧠 Ollama backend running at http://localhost:3001')
})
