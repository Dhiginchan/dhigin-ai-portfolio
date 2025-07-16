import React from 'react'
import { SiPython, SiNumpy, SiPytorch, SiTensorflow, SiLangchain, SiStreamlit, SiOpenai, SiFastapi, SiGithub, SiVite } from 'react-icons/si'

const skills = [
  { name: "Python", icon: <SiPython size={30} /> },
  { name: "Numpy", icon: <SiNumpy size={30} /> },
  { name: "Pandas", icon: "🧮" },
  { name: "Pytorch", icon: <SiPytorch size={30} /> },
  { name: "Tensorflow", icon: <SiTensorflow size={30} /> },
  { name: "LangChain", icon: <SiLangchain size={30} /> },
  { name: "Streamlit", icon: <SiStreamlit size={30} /> },
  { name: "OpenAI API", icon: <SiOpenai size={30} /> },
  { name: "n8n", icon: "🟠" },
  { name: "GitHub", icon: <SiGithub size={30} /> },
]

const Skills = () => {
  return (
    <section className="p-10 text-white bg-zinc-900">
      <h2 className="text-3xl font-bold mb-8 text-purple-400 text-center">Skills</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 place-items-center">
        {skills.map((skill, i) => (
          <div
            key={i}
            className="bg-zinc-800 rounded-lg p-4 w-full flex flex-col items-center justify-center hover:scale-105 transition-transform duration-300 shadow-md"
          >
            <div className="text-3xl mb-2">{skill.icon}</div>
            <p className="text-sm font-medium text-center">{skill.name}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Skills
