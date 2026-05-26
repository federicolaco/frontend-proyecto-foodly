import { Navbar } from '../components/Navbar'
import { Hero } from '../components/Hero'
import { MostOrdered } from '../components/MostOrdered'
import { HowItWorks } from '../components/HowItWorks'

export function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <MostOrdered />
        <HowItWorks />
      </main>
    </>
  )
}
