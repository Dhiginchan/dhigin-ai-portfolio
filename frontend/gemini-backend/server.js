import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config()
const app = express()
app.use(cors())
app.use(express.json())

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    const result = await model.generateContent(message)
    const response = result.response.text()
    console.log("Gemini said:", response)
    res.json({ reply: response })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(3001, () => {
  console.log('⚡ Gemini backend running on http://localhost:3001')
})
