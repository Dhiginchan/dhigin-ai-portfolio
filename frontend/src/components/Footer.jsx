import React from 'react'
import { Github, Linkedin, Mail } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-zinc-900 text-white py-6 mt-10 text-center">
      <div className="flex justify-center gap-6 mb-4">
        <a href="https://github.com/Dhiginchan" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition">
          <Github size={24} />
        </a>
        <a href="https://www.linkedin.com/in/dhigin-chanikya/" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition">
          <Linkedin size={24} />
        </a>
        <a href="mailto:dhiginchanikya@gmail.com" className="hover:text-purple-400 transition">
          <Mail size={24} />
        </a>
      </div>
      <p className="text-sm text-gray-400">
        © {new Date().getFullYear()} Dhigin Chanikya G. All rights reserved.
      </p>
    </footer>
  )
}

export default Footer
