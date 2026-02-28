import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const headerWrapperRef = useRef(null)

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setScrollProgress(Math.min(100, Math.max(0, progress)))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  useEffect(() => {
    const updateHeaderOffset = () => {
      if (headerWrapperRef.current) {
        const height = headerWrapperRef.current.getBoundingClientRect().height
        document.documentElement.style.setProperty('--header-offset', `${height}px`)
      }
    }

    updateHeaderOffset()

    const resizeObserver = new ResizeObserver(updateHeaderOffset)
    if (headerWrapperRef.current) {
      resizeObserver.observe(headerWrapperRef.current)
    }

    window.addEventListener('resize', updateHeaderOffset)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateHeaderOffset)
    }
  }, [])

  return (
    <>
      <div className="app-container">
        <BarberBackground />
        <div className="header-wrapper" ref={headerWrapperRef}>
          <Header />
          <div className="scroll-progress">
            <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
          </div>
        </div>
        <main className="main-content">
          <FullWidthPhotoSection />
          <PhotoWithHeading />
          <HeadingWithPhoto />
        </main>
      </div>
      <div className="footer-bleed">
        <Footer />
      </div>
    </>
  )
}

function BarberBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
      setIsVisible(true)
    }

    const handleTouchMove = (event) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0]
        setMousePosition({ x: touch.clientX, y: touch.clientY })
        setIsVisible(true)
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleTouchEnd = () => {
      setIsVisible(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return (
    <div className="barber-background">
      <div className="bg-stripes" />
      <div className="bg-radial" />
      <div className="bg-grid" />
      <div className="bg-pole bg-pole-left">
        <div className="bg-pole-stripes bg-pole-stripes-left" />
        <div className="bg-pole-glass" />
      </div>
      <div className="bg-pole bg-pole-right">
        <div className="bg-pole-stripes bg-pole-stripes-right" />
        <div className="bg-pole-glass" />
      </div>
      <div className="bg-spotlight bg-spotlight-left" />
      <div className="bg-spotlight bg-spotlight-right" />
      <div
        className={`bg-pointer ${isVisible ? 'is-visible' : ''}`}
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
        }}
      >
        <div className="bg-pointer-outer" />
        <div className="bg-pointer-mid" />
        <div className="bg-pointer-core" />
      </div>
    </div>
  )
}

function useInViewAnimation(refs) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2 }
    )

    refs.forEach((ref) => {
      if (ref.current) {
        observer.observe(ref.current)
      }
    })

    return () => observer.disconnect()
  }, [refs])
}

function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <img src="img/Aicon.png" alt="Logo Ristorante" className="logo" />
        <h1>Ale & Hairs</h1>
      </div>
      <nav className="header-nav">
        <ul>
          <li><a href="#galleria">Galleria</a></li>
          <li><a href="#chi-siamo">Chi siamo noi?</a></li>
        </ul>
      </nav>
      <div className="header-right">
        <select className="language-selector" aria-label="Seleziona lingua">
          <option value="it">Italiano</option>
          <option value="en">English</option>
        </select>
      </div>
    </header>
  )
}

function FullWidthPhotoSection() {
  const heroRef = useRef(null)

  useInViewAnimation([heroRef])

  return (
    <section className="hero-section">
      <div className="hero-content animate-on-view fade-in" ref={heroRef}>
        <div className="hero-title">
          <h2>L'arte del giusto taglio</h2>
        </div>
        <div className="hero-text">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum.</p>
        </div>
      </div>
    </section>
  )
}

function PhotoWithHeading() {
  const photoRef = useRef(null)
  const headingRef = useRef(null)

  useInViewAnimation([photoRef, headingRef])

  return (
    <section className="photo-heading-section">
      <div className="photo-container animate-on-view fade-in" ref={photoRef}>
        <img src="img/hairsaloon_1.jpg" alt="Parruccheria" />
      </div>
      <div className="heading-container animate-on-view slide-in-right" ref={headingRef}>
        <h2>Il nostro obiettivo</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam.</p>
      </div>
    </section>
  )
}

function HeadingWithPhoto() {
  const headingRef = useRef(null)
  const photoRef = useRef(null)

  useInViewAnimation([headingRef, photoRef])

  return (
    <section className="heading-photo-section">
      <div className="content-wrapper">
        <div className="heading-container animate-on-view slide-in-left" ref={headingRef}>
          <h3>La nostra missione</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nisi. Nulla quis sem at nibh elementum imperdiet.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce nec tellus sed augue semper porta. Mauris massa.</p>
        </div>
        <div className="photo-container animate-on-view fade-in" ref={photoRef}>
          <img src="/img/hairsaloon_2.jpg" alt="Parruccheria" />
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <p>Partita IVA: 12345678901</p>
      <p>Sede: Via Roma, 123, 00100, Roma, Italia</p>
      <p>Telefono: +39 06 1234567</p>
    </footer>
  )
}

export default App
