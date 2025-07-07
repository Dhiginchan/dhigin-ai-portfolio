import React from 'react'

const Experience = () => {
  return (
    <section className="p-10">
      <h2 className="text-3xl font-bold mb-6 text-purple-400">Experience</h2>
      <ol className="relative border-l border-gray-700">
        <li className="mb-10 ml-4">
          <div className="absolute w-3 h-3 bg-purple-500 rounded-full mt-1.5 -left-1.5 border border-white"></div>
          <time className="mb-1 text-sm font-normal leading-none text-gray-400">
            2025 – Present
          </time>
          <h3 className="text-lg font-semibold text-white">
            GenAI Intern @ Infosys Springboard
          </h3>
          <p className="text-base font-normal text-gray-300">
            Worked on RAG-based quote system, AI ticket evaluator, and voice-based GPT interface.
          </p>
        </li>
        <li className="ml-4">
          <div className="absolute w-3 h-3 bg-purple-500 rounded-full mt-1.5 -left-1.5 border border-white"></div>
          <time className="mb-1 text-sm font-normal leading-none text-gray-400">
            2024
          </time>
          <h3 className="text-lg font-semibold text-white">
            Student Projects & AI Freelance
          </h3>
          <p className="text-base font-normal text-gray-300">
            Built GPT-powered tools with LangChain, Streamlit, FastAPI, and OpenVoice. Delivered production-ready systems.
          </p>
        </li>
      </ol>
    </section>
  )
}

export default Experience
