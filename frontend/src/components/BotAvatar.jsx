import { motion } from 'framer-motion'

const BotAvatar = ({ mood = 'idle' }) => {
  const eyeColor = {
    idle: '#A855F7',
    thinking: '#38BDF8',
    error: '#EF4444',
  }[mood]

  return (
    <motion.svg
      width="40"
      height="40"
      viewBox="0 0 100 100"
      className="rounded-full bg-zinc-900 p-2 border-2 shadow-lg hover:shadow-purple-500/60 transition-all duration-300 ease-in-out"
      animate={{
        scale: [1, 1.05, 1],
        rotate: [0, 1, -1, 0],
      }}
      transition={{ repeat: Infinity, duration: 4 }}
    >
      {/* Head */}
      <circle cx="50" cy="50" r="45" fill="#1e1e2e" stroke="#A855F7" strokeWidth="4" />
      
      {/* Eyes */}
      <motion.circle
        cx="35"
        cy="40"
        r="6"
        fill={eyeColor}
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.3 }}
      />
      <motion.circle
        cx="65"
        cy="40"
        r="6"
        fill={eyeColor}
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.3 }}
      />

      {/* Mouth */}
      {mood === 'error' ? (
        <line x1="35" y1="65" x2="65" y2="65" stroke="#EF4444" strokeWidth="4" />
      ) : (
        <path
          d="M35 60 Q50 70 65 60"
          fill="transparent"
          stroke={eyeColor}
          strokeWidth="3"
        />
      )}
    </motion.svg>
  )
}

export default BotAvatar
