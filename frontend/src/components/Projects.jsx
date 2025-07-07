import React from 'react'

const projects = [
  // INTERNSHIP PROJECTS
  {
    title: "Multi-LLM Customer Support Chatbot",
    description:
      "Designed & deployed a chatbot using LangChain + Gemini for education and support. Achieved 30%+ higher accuracy over rule-based systems.",
    tech: ["LangChain", "Gemini API", "LLM Orchestration"],
    link: "", // no repo, internship work
  },
  {
    title: "AI-Powered Video Translator",
    description:
      "Built a real-time video translation pipeline using ffmpeg and Google TTS. Enabled support for 10+ languages with <1s latency.",
    tech: ["ffmpeg", "Google TTS", "Translation", "Speech"],
    link: "", // no repo, internship work
  },
  {
    title: "Pinecone Semantic Search Optimization",
    description:
      "Optimized RAG-based system using Pinecone vector DB, reducing retrieval latency by 40% and improving semantic search performance.",
    tech: ["Pinecone", "RAG", "Vector Search"],
    link: "", // no repo, internship work
  },

  // GITHUB PROJECTS
  {
    title: "Ticket Intelligence System",
    description:
      "Machine learning pipeline to classify support tickets by urgency and issue type with rule-based entity extraction and UI.",
    tech: ["Python", "Scikit-learn", "NLP", "Streamlit"],
    link: "https://github.com/Dhiginchan/ML_TICKET-CLASSIFIER",
  },
  {
    title: "Semantic Quote Finder (RAG)",
    description:
      "RAG system using sentence embeddings and vector search to retrieve quotes by topic, author, or tag — Streamlit UI frontend.",
    tech: ["LangChain", "Pinecone", "Sentence Transformers", "Streamlit"],
    link: "https://github.com/Dhiginchan/RAG-Based_Semantic_Quote_Retrieval_System",
  },
  {
    title: "Gmail AI Agent",
    description:
      "n8n-powered AI agent to autonomously handle Gmail: send, reply, organize, and summarize emails contextually.",
    tech: ["n8n", "OpenAI API", "LangChain", "Gmail API"],
    link: "https://github.com/Dhiginchan?tab=repositories",
  },
]

const Projects = () => {
  return (
    <section className="p-10 bg-zinc-950 text-white">
      <h2 className="text-3xl font-bold mb-8 text-purple-400 text-center">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <div
            key={index}
            className="bg-zinc-800 rounded-lg p-6 hover:-translate-y-1 transition-transform duration-300 shadow-md"
          >
            <h3 className="text-xl font-bold text-purple-300 mb-2">
              {project.title}
            </h3>
            <p className="text-gray-300 mb-4">{project.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tech.map((tech, i) => (
                <span
                  key={i}
                  className="bg-purple-700 text-white text-xs px-2 py-1 rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-auto text-sm text-purple-400 hover:underline"
              >
                View on GitHub →
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default Projects
