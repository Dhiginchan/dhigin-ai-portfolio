import React from 'react'
import { motion } from 'framer-motion'
import { Typewriter } from 'react-simple-typewriter'

const Hero = () => {
  return (
    <section className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-purple-900 to-black text-center p-6">
      
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-5xl md:text-6xl font-extrabold text-white mb-6"
      >
        Hi, I’m Dhigin Chanikya.
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="text-2xl md:text-3xl text-purple-400 font-medium"
      >
        <Typewriter
          words={[
            'I build intelligent systems.',
            'I make machines talk like humans.',
            'AI is my playground.',
            'Future engineer. Present badass.',
          ]}
          loop={0}
          cursor
          cursorStyle="_"
          typeSpeed={60}
          deleteSpeed={40}
          delaySpeed={1500}
        />
      </motion.h2>
    </section>
  )
}

export default Hero
