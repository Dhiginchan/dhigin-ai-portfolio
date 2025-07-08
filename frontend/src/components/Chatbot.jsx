import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import BotAvatar from './BotAvatar'

const Chatbot = () => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const chatRef = useRef()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSend = async () => {
    if (!input.trim()) return
    setMessages((prev) => [...prev, { sender: 'user', text: input }])
    setInput('')
    setLoading(true)
    setError(false)

    try {
      const response = await fetch('https://your-backend-url/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ message: input }),
      })

      const data = await response.json()
      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: data.reply || '🤖 Gemini didn’t reply anything.'
      }])
    } catch (err) {
      console.error("❌ API Error:", err)
      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: '❌ Gemini API error. Try again.'
      }])
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const currentMood = error ? 'error' : loading ? 'thinking' : 'idle'

  return (
    <>
      {/* ✨ Floating Avatar Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 cursor-pointer bg-gradient-to-r from-purple-700 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
        onClick={() => setOpen(!open)}
      >
        <BotAvatar mood={currentMood} />
        {!open && <span className="hidden md:inline text-sm">Ask me anything</span>}
      </motion.div>

      {/* 🧠 Chat Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 w-[22rem] max-h-[70vh] bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-2xl p-4 shadow-2xl z-[999] flex flex-col"
          >
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-white hover:text-red-400">
              <X size={18} />
            </button>

            <div className="overflow-y-auto flex-1 pr-2 text-sm mt-6 space-y-2">
              {messages.map((m, i) => (
                <div key={i} className={`text-${m.sender === 'user' ? 'right' : 'left'}`}>
                  <span className={`inline-block px-3 py-2 rounded-lg ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-700 to-pink-500 text-white'
                      : 'bg-zinc-800 text-purple-300'
                  }`}>
                    {m.text}
                  </span>
                </div>
              ))}
              {loading && (
                <div className="text-purple-400 text-xs animate-pulse">Gemini is thinking...</div>
              )}
            </div>

            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg text-black focus:outline-none"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button onClick={handleSend} className="bg-purple-700 hover:bg-purple-800 text-white text-sm px-4 py-2 rounded-lg">
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Chatbot
