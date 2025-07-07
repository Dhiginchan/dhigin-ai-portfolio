import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config()

const app = express()
app.use(cors()) // For production, restrict: cors({ origin: 'https://yourdomain.com' })
app.use(express.json())

// Load API Key and model from .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro'

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required.' })
    }

    console.log(`📨 User Message: "${message}"`)

    const result = await model.generateContent(message)
    const reply = result?.response?.text?.() || '🤖 Gemini had no reply.'

    console.log(`🤖 Gemini Reply: "${reply}"`)
    res.json({ reply })

  } catch (err) {
    console.error('❌ Gemini API Error:', err.message)
    res.status(500).json({ error: 'Gemini API failed. Please try again later.' })
  }
})

// Start the server
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`⚡ Gemini backend running on http://localhost:${PORT}`)
})
