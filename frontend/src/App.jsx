import Hero from './components/Hero'
import Projects from './components/Projects'
import Skills from './components/Skills'
import Experience from './components/Experience'
import Chatbot from './components/Chatbot'
import Footer from './components/Footer'

function App() {
  return (
    <div className="bg-black text-white">
      <Hero />
      <Projects />
      <Skills />
      <Experience />
      <Chatbot />
      <Footer />
    </div>
  )
}

export default App
