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

  // 👂 Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 📡 Send message to backend
  const handleSend = async () => {
    if (!input.trim()) return

    setMessages((prev) => [...prev, { sender: 'user', text: input }])
    setInput('')
    setLoading(true)
    setError(false)

    try {
      const response = await fetch("https://1e9ff413ae74.ngrok-free.app/chat", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ message: input }),
      })

      const data = await response.json()
      console.log("🤖 Ollama RAG Server replied:", data)

      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: data.reply || '🤖 Ollama didn’t reply anything.'
      }])
    } catch (err) {
      console.error("❌ Ollama API error in frontend:", err)
      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: '❌ Ollama API error. Try again.'
      }])
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const currentMood = error ? 'error' : loading ? 'thinking' : 'idle'

  return (
    <>
      {/* 💬 Floating Avatar */}
      <div
        className="fixed bottom-5 right-5 z-50 cursor-pointer flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 rounded-full shadow-xl"
        onClick={() => setOpen(!open)}
      >
        <BotAvatar mood={currentMood} />
        {!open && <span className="text-sm hidden md:inline ml-2">How can I help you?</span>}
      </div>

      {/* 💬 Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-20 right-5 w-80 max-h-[75vh] bg-zinc-900 text-white p-4 rounded-xl shadow-2xl z-[999] flex flex-col"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 text-white hover:text-red-500"
            >
              <X size={18} />
            </button>

            <div className="overflow-y-auto flex-1 space-y-2 mb-2 text-sm pr-1 mt-6">
              {messages.map((m, i) => (
                <div key={i} className={`${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  <span
                    className={`inline-block px-3 py-2 rounded-lg whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-purple-700 text-white'
                        : 'bg-zinc-800 text-purple-300'
                    }`}
                  >
                    {m.text}
                  </span>
                </div>
              ))}
              {loading && (
                <div className="text-left text-xs text-purple-400 animate-pulse">
                  Ollama is thinking...
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-1">
              <input
                className="flex-1 p-2 text-black rounded focus:outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
              />
              <button
                onClick={handleSend}
                className="bg-purple-700 px-3 py-1 text-sm rounded hover:bg-purple-800 transition-all"
              >
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
