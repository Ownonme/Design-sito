import { useEffect, useRef, useState } from 'react'
import { fetchLocalDb, localDb } from './data/localDb'
import './App.css'

function App() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const headerWrapperRef = useRef(null)
  const [currentPage, setCurrentPage] = useState(() => getPageFromHash(window.location.hash))
  const [currentProductId, setCurrentProductId] = useState(() => getProductIdFromHash(window.location.hash))
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [db, setDb] = useState(localDb)

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

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      const page = getPageFromHash(hash)
      setCurrentPage(page)
      setCurrentProductId(getProductIdFromHash(hash))
      if (hash && page === 'home') {
        requestAnimationFrame(() => {
          const target = document.getElementById(hash.slice(1))
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        })
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    let isActive = true
    fetchLocalDb().then((data) => {
      if (isActive) {
        setDb({
          ...data,
          account: {
            firstName: 'Luca',
            lastName: 'De Rossi',
            email: 'rossideluca11@gmail.com',
            avatar: 'img/hairstaff_1.jpg',
            role: 'admin',
            isLoggedIn: true,
          },
        })
      }
    })
    return () => {
      isActive = false
    }
  }, [])

  return (
    <>
      <div className="app-container">
        <BarberBackground />
        <div className="header-wrapper" ref={headerWrapperRef}>
          <Header
            db={db}
            cartCount={getCartCount(cartItems)}
            onCartOpen={() => setIsCartOpen(true)}
          />
          <div className="scroll-progress">
            <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }} />
          </div>
        </div>
        {currentPage === 'gallery' ? <GalleryPage db={db} /> : null}
        {currentPage === 'products' ? <ProductsPage db={db} /> : null}
        {currentPage === 'product'
          ? <ProductDetailPage db={db} productId={currentProductId} onAddToCart={setCartItems} />
          : null}
        {currentPage === 'profile' ? <ProfilePage db={db} cartItems={cartItems} /> : null}
        {currentPage === 'admin'
          ? <AdminPage db={db} onUpdate={setDb} />
          : null}
        {currentPage === 'home' ? <HomePage db={db} /> : null}
      </div>
      {isCartOpen ? <CartModal cartItems={cartItems} onClose={() => setIsCartOpen(false)} /> : null}
      <div className="footer-bleed">
        <Footer db={db} />
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

function Header({ db, cartCount, onCartOpen }) {
  const { store, account } = db
  const canAccessAdmin = account?.isLoggedIn && account?.role === 'admin'

  return (
    <header className="header">
      <div className="header-left">
        <img src={store.logo} alt={`Logo ${store.name}`} className="logo" />
        <h1>{store.name}</h1>
      </div>
      <nav className="header-nav">
        <ul>
          <li><a href="#galleria">Galleria</a></li>
          <li><a href="#prodotti">Prodotti</a></li>
          <li><a href="#chi-siamo">Chi siamo noi?</a></li>
        </ul>
      </nav>
      <div className="header-right">
        <a className="header-link" href="#profilo">Area personale</a>
        {canAccessAdmin ? <a className="header-link" href="#admin">Strumenti admin</a> : null}
        <button className="cart-button" type="button" onClick={onCartOpen} aria-label="Apri carrello">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M6 6h15l-1.6 8.5a2 2 0 0 1-2 1.5H9.4a2 2 0 0 1-2-1.5L5 4H2V2h4l1 4zm2.2 10a1.8 1.8 0 1 1-1.8 1.8A1.8 1.8 0 0 1 8.2 16zm9 0a1.8 1.8 0 1 1-1.8 1.8A1.8 1.8 0 0 1 17.2 16z" />
          </svg>
          {cartCount > 0 ? <span className="cart-badge">{cartCount}</span> : null}
        </button>
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
    <section className="heading-photo-section" id="chi-siamo">
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

function HomePage({ db }) {
  return (
    <main className="main-content" id="home">
      <FullWidthPhotoSection />
      <PhotoWithHeading />
      <HeadingWithPhoto />
      <TeamSection db={db} />
      <TestimonialsSection db={db} />
    </main>
  )
}

function GalleryPage({ db }) {
  return (
    <main className="main-content">
      <GallerySection db={db} />
    </main>
  )
}

function ProductsPage({ db }) {
  return (
    <main className="main-content">
      <ProductsSection db={db} />
    </main>
  )
}

function GallerySection({ db }) {
  const { galleryCuts } = db

  return (
    <section className="gallery-section" id="galleria">
      <div className="gallery-header">
        <h2>Galleria</h2>
        <p>Una selezione di tagli realizzati in salone con attenzione ai dettagli.</p>
      </div>
      <div className="gallery-grid">
        {sortByOrder(galleryCuts).map((item) => (
          <article className="gallery-card" key={item.title}>
            <div className="gallery-image">
              <img src={item.image} alt={item.title} />
            </div>
            <div className="gallery-body">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProductsSection({ db }) {
  const { products } = db

  return (
    <section className="products-section" id="prodotti">
      <div className="products-header">
        <h2>Prodotti</h2>
        <p>Selezione di prodotti professionali disponibili in salone.</p>
      </div>
      <div className="products-grid">
        {sortByOrder(products).map((item) => (
          <a className="products-card" key={item.id} href={`#prodotto-${item.id}`}>
            <div className="products-image">
              <img src={item.image} alt={item.title} />
            </div>
            <div className="products-body">
              <h3>{item.title}</h3>
              <p>{item.shortDescription}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

function TeamSection({ db }) {
  const { team } = db

  return (
    <section className="team-section">
      <div className="team-header">
        <h2>Chi siamo noi?</h2>
        <p>Un team unito da passione, esperienza e attenzione alla persona.</p>
      </div>
      <div className="team-grid">
        {sortByOrder(team).map((member) => (
          <article className="team-card" key={member.name}>
            <div className="team-card-inner">
              <div className="team-avatar">
                <img src={member.image} alt={member.name} />
              </div>
              <div className="team-info">
                <h3>{member.name}</h3>
                <span className="team-role">{member.role}</span>
                <p>{member.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function TestimonialsSection({ db }) {
  const { testimonials } = db

  return (
    <section className="testimonials-section">
      <div className="testimonials-header">
        <h2>Parlano di noi</h2>
      </div>
      <div className="testimonials-grid">
        {testimonials.map((item) => (
          <article className="testimonial-card" key={item.title}>
            <h3>{item.title}</h3>
            <blockquote className="testimonial-quote">
              <p>{item.text}</p>
              <cite>{item.author}</cite>
            </blockquote>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProductDetailPage({ db, productId, onAddToCart }) {
  const { products } = db
  const product = products.find((item) => item.id === productId) || products[0]

  return (
    <main className="main-content">
      <section className="product-detail" id="prodotto">
        <div className="product-detail-grid">
          <div className="product-detail-image">
            <img src={product.image} alt={product.title} />
          </div>
          <div className="product-detail-info">
            <h2>{product.title}</h2>
            <p className="product-detail-description">{product.description}</p>
            <p className="product-detail-price">{formatPrice(product.price)}</p>
            <button
              className="product-detail-cta"
              type="button"
              onClick={() => addItemToCart(onAddToCart, product)}
            >
              Aggiungi al carrello
            </button>
          </div>
        </div>
        <div className="product-detail-extra">
          <div className="product-detail-block">
            <h3>Descrizione aggiuntiva prodotti</h3>
            <p>{product.extraDescription}</p>
          </div>
          <div className="product-detail-columns">
            <div>
              <h4>Ingredienti</h4>
              <p>{product.ingredients}</p>
            </div>
            <div>
              <h4>Consigliato per</h4>
              <p>{product.recommendedFor}</p>
            </div>
            <div>
              <h4>Note di utilizzo</h4>
              <p>{product.usageNotes}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function getPageFromHash(hash) {
  if (hash === '#galleria') return 'gallery'
  if (hash === '#prodotti') return 'products'
  if (hash === '#profilo') return 'profile'
  if (hash === '#admin') return 'admin'
  if (hash.startsWith('#prodotto-')) return 'product'
  return 'home'
}

function getProductIdFromHash(hash) {
  if (hash.startsWith('#prodotto-')) {
    return hash.replace('#prodotto-', '')
  }
  return null
}

function ProfilePage({ db, cartItems }) {
  const { account } = db
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <main className="main-content">
      <section className="profile-section" id="profilo">
        <div className="profile-card">
          <div className="profile-avatar">
            <img src={account.avatar} alt={`Foto profilo ${account.firstName}`} />
          </div>
          <h2>{account.lastName} {account.firstName}</h2>
          <p className="profile-email">{account.email}</p>
        </div>
        <details className="profile-cart" open>
          <summary>Carrello</summary>
          <div className="profile-cart-content">
            {cartItems.length === 0 ? (
              <p>Il carrello è vuoto.</p>
            ) : (
              cartItems.map((item) => (
                <div className="profile-cart-item" key={item.id}>
                  <img src={item.image} alt={item.title} />
                  <div>
                    <p>{item.title}</p>
                    <span>Quantità: {item.quantity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="cart-summary">
            <div className="cart-total">
              <span>Totale</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            <button className="cart-checkout" type="button">Procedi all'acquisto</button>
          </div>
        </details>
      </section>
    </main>
  )
}

function AdminPage({ db, onUpdate }) {
  const { account, team, products, galleryCuts } = db
  const isAdmin = account?.isLoggedIn && account?.role === 'admin'
  const now = getNow()
  const sortedTeam = sortByOrder(team)
  const sortedProducts = sortByOrder(products)
  const sortedCuts = sortByOrder(galleryCuts)

  const updateSection = (key, items) => {
    onUpdate((prev) => ({ ...prev, [key]: items }))
  }

  const updateItem = (list, index, changes) =>
    list.map((item, idx) => (idx === index ? { ...item, ...changes, updatedAt: now } : item))

  const nextOrder = (list) => {
    if (list.length === 0) return 1
    return Math.max(...list.map((item) => Number(item.order) || 0)) + 1
  }

  if (!isAdmin) {
    return (
      <main className="main-content">
        <section className="admin-section">
          <h2>Strumenti amministratore</h2>
          <p>Accesso negato. Devi essere loggato con ruolo admin.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="main-content">
      <section className="admin-section">
        <h2>Strumenti amministratore</h2>

        <div className="admin-block">
          <div className="admin-block-header">
            <h3>Team</h3>
            <button
              className="admin-button"
              type="button"
              onClick={() =>
                updateSection('team', [
                  ...team,
                  {
                    name: 'Nuovo membro',
                    role: 'Ruolo',
                    description: 'Descrizione professionale.',
                    image: 'img/hairstaff_1.jpg',
                    order: nextOrder(team),
                    createdAt: now,
                    updatedAt: now,
                  },
                ])
              }
            >
              Aggiungi
            </button>
          </div>
          <div className="admin-list">
            {sortedTeam.map((member) => {
              const listIndex = team.indexOf(member)
              return (
              <div className="admin-card" key={`${member.name}-${listIndex}`}>
                <div className="admin-preview">
                  <img src={member.image} alt={member.name} />
                </div>
                <div className="admin-fields">
                  <input
                    className="admin-input"
                    type="number"
                    value={member.order}
                    onChange={(event) =>
                      updateSection(
                        'team',
                        updateItem(team, listIndex, { order: Number(event.target.value) })
                      )
                    }
                  />
                  <input
                    className="admin-input"
                    value={member.name}
                    onChange={(event) =>
                      updateSection(
                        'team',
                        updateItem(team, listIndex, { name: event.target.value })
                      )
                    }
                  />
                  <input
                    className="admin-input"
                    value={member.role}
                    onChange={(event) =>
                      updateSection(
                        'team',
                        updateItem(team, listIndex, { role: event.target.value })
                      )
                    }
                  />
                  <input
                    className="admin-input"
                    value={member.image}
                    onChange={(event) =>
                      updateSection(
                        'team',
                        updateItem(team, listIndex, { image: event.target.value })
                      )
                    }
                  />
                  <textarea
                    className="admin-textarea"
                    value={member.description}
                    onChange={(event) =>
                      updateSection(
                        'team',
                        updateItem(team, listIndex, { description: event.target.value })
                      )
                    }
                  />
                  <div className="admin-meta">
                    <span>Creato: {formatDate(member.createdAt)}</span>
                    <span>Modificato: {formatDate(member.updatedAt)}</span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>

        <div className="admin-block">
          <div className="admin-block-header">
            <h3>Prodotti</h3>
            <button
              className="admin-button"
              type="button"
              onClick={() =>
                updateSection('products', [
                  ...products,
                  {
                    id: String(Date.now()),
                    title: 'Nuovo prodotto',
                    shortDescription: 'Descrizione breve.',
                    description: 'Descrizione completa.',
                    price: 0,
                    image: 'img/Product1.jpg',
                    extraDescription: 'Descrizione aggiuntiva.',
                    ingredients: 'Ingredienti.',
                    recommendedFor: 'Consigliato per.',
                    usageNotes: 'Note di utilizzo.',
                    order: nextOrder(products),
                    createdAt: now,
                    updatedAt: now,
                  },
                ])
              }
            >
              Aggiungi
            </button>
          </div>
          <div className="admin-list">
            {sortedProducts.map((product) => {
              const listIndex = products.indexOf(product)
              return (
              <div className="admin-card" key={product.id}>
                <div className="admin-preview">
                  <img src={product.image} alt={product.title} />
                </div>
                <div className="admin-fields">
                  <input
                    className="admin-input"
                    type="number"
                    value={product.order}
                    onChange={(event) =>
                      updateSection(
                        'products',
                        updateItem(products, listIndex, { order: Number(event.target.value) })
                      )
                    }
                  />
                  <input
                    className="admin-input"
                    value={product.title}
                    onChange={(event) =>
                      updateSection(
                        'products',
                        updateItem(products, listIndex, { title: event.target.value })
                      )
                    }
                  />
                  <input
                    className="admin-input"
                    value={product.shortDescription}
                    onChange={(event) =>
                      updateSection(
                        'products',
                        updateItem(products, listIndex, { shortDescription: event.target.value })
                      )
                    }
                  />
                  <input
                    className="admin-input"
                    type="number"
                    value={product.price}
                    onChange={(event) =>
                      updateSection(
                        'products',
                        updateItem(products, listIndex, { price: Number(event.target.value) })
                      )
                    }
                  />
                  <input
                    className="admin-input"
                    value={product.image}
                    onChange={(event) =>
                      updateSection(
                        'products',
                        updateItem(products, listIndex, { image: event.target.value })
                      )
                    }
                  />
                  <div className="admin-meta">
                    <span>Creato: {formatDate(product.createdAt)}</span>
                    <span>Modificato: {formatDate(product.updatedAt)}</span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>

        <div className="admin-block">
          <div className="admin-block-header">
            <h3>Galleria</h3>
            <button
              className="admin-button"
              type="button"
              onClick={() =>
                updateSection('galleryCuts', [
                  ...galleryCuts,
                  {
                    title: 'Nuovo taglio',
                    description: 'Descrizione taglio.',
                    image: 'img/Taglio1.webp',
                    order: nextOrder(galleryCuts),
                    createdAt: now,
                    updatedAt: now,
                  },
                ])
              }
            >
              Aggiungi
            </button>
          </div>
          <div className="admin-list">
            {sortedCuts.map((item) => {
              const listIndex = galleryCuts.indexOf(item)
              return (
              <div className="admin-card" key={`${item.title}-${listIndex}`}>
                <div className="admin-preview">
                  <img src={item.image} alt={item.title} />
                </div>
                <div className="admin-fields">
                  <input
                    className="admin-input"
                    type="number"
                    value={item.order}
                    onChange={(event) =>
                      updateSection(
                        'galleryCuts',
                        updateItem(galleryCuts, listIndex, { order: Number(event.target.value) })
                      )
                    }
                  />
                  <input
                    className="admin-input"
                    value={item.title}
                    onChange={(event) =>
                      updateSection(
                        'galleryCuts',
                        updateItem(galleryCuts, listIndex, { title: event.target.value })
                      )
                    }
                  />
                  <input
                    className="admin-input"
                    value={item.description}
                    onChange={(event) =>
                      updateSection(
                        'galleryCuts',
                        updateItem(galleryCuts, listIndex, { description: event.target.value })
                      )
                    }
                  />
                  <input
                    className="admin-input"
                    value={item.image}
                    onChange={(event) =>
                      updateSection(
                        'galleryCuts',
                        updateItem(galleryCuts, listIndex, { image: event.target.value })
                      )
                    }
                  />
                  <div className="admin-meta">
                    <span>Creato: {formatDate(item.createdAt)}</span>
                    <span>Modificato: {formatDate(item.updatedAt)}</span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>
    </main>
  )
}

function CartModal({ cartItems, onClose }) {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="cart-modal">
      <div className="cart-modal-content" role="dialog" aria-modal="true" aria-label="Carrello">
        <div className="cart-modal-header">
          <h2>Carrello</h2>
          <button className="cart-close" type="button" onClick={onClose}>Chiudi</button>
        </div>
        <details className="cart-details" open>
          <summary>Prodotti inseriti</summary>
          <div className="cart-items">
            {cartItems.length === 0 ? (
              <p>Il carrello è vuoto.</p>
            ) : (
              cartItems.map((item) => (
                <div className="cart-item" key={item.id}>
                  <img src={item.image} alt={item.title} />
                  <div>
                    <p>{item.title}</p>
                    <span>Quantità: {item.quantity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </details>
        <div className="cart-summary">
          <div className="cart-total">
            <span>Totale</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <button className="cart-checkout" type="button">Procedi all'acquisto</button>
        </div>
      </div>
      <button className="cart-modal-overlay" type="button" onClick={onClose} aria-label="Chiudi carrello" />
    </div>
  )
}

function getCartCount(items) {
  return items.reduce((total, item) => total + item.quantity, 0)
}

function sortByOrder(items) {
  return [...items].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0))
}

function getNow() {
  return new Date().toISOString().slice(0, 16)
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatPrice(value) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value)
}

function addItemToCart(setCartItems, product) {
  setCartItems((items) => {
    const existing = items.find((item) => item.id === product.id)
    if (existing) {
      return items.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      )
    }
    return [...items, { ...product, quantity: 1 }]
  })
}

function Footer({ db }) {
  const { store } = db

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-item">
          <span className="footer-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M7 2h7l5 5v15H7V2zm7 1.5V7h3.5L14 3.5zM9 11h8v2H9v-2zm0 4h8v2H9v-2z" />
            </svg>
          </span>
          <span>Partita IVA: {store.vat}</span>
        </div>
        <div className="footer-item">
          <span className="footer-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M12 2a7 7 0 0 1 7 7c0 4.2-4.1 8.7-7 12-2.9-3.3-7-7.8-7-12a7 7 0 0 1 7-7zm0 3a4 4 0 0 0-4 4c0 2.4 2.1 5.4 4 7.7 1.9-2.3 4-5.3 4-7.7a4 4 0 0 0-4-4zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" />
            </svg>
          </span>
          <span>Sede: {store.address}</span>
        </div>
        <div className="footer-item">
          <span className="footer-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M6.6 3h2.6l1 4.2-2 .8c.6 1.8 1.7 3.4 3.2 4.9 1.5 1.5 3.1 2.6 4.9 3.2l.8-2 4.2 1v2.6c0 1-1 1.9-2 1.8-3.3-.4-6.6-2.2-9.3-4.9C7 11.9 5.2 8.6 4.8 5.2c-.1-1 0-2 1.8-2.2z" />
            </svg>
          </span>
          <span>Telefono: {store.phone}</span>
        </div>
      </div>
    </footer>
  )
}

export default App
