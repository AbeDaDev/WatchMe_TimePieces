import { useEffect, useMemo, useState } from 'react'
import Collection from './Collection.jsx'
import Nav from './nav.jsx'
import RetailerFinderModal from './RetailerFinderModal.jsx'
import Wishlist from './Wishlist.jsx'
import WatchCard from './watchcard.jsx'
import './App.css'

const showcaseSeeds = [
  {
    title: 'Rolex Air-King',
    badge: 'Featured',
    detail: '$8,150',
    description: 'A clean aviation-inspired watch with a strong everyday presence.',
    meta: ['Rolex', 'Air-King', 'Steel'],
  },
  {
    title: 'Omega Seamaster Diver 300M',
    badge: 'Best Seller',
    detail: '$5,485',
    description: 'A modern dive watch known for its wave dial and tool-watch durability.',
    meta: ['Omega', 'Seamaster', 'Diver'],
  },
  {
    title: 'Breitling Navitimer B01',
    badge: 'Popular',
    detail: '$10,300',
    description: 'A classic pilot watch with a slide rule bezel and chronograph layout.',
    meta: ['Breitling', 'Navitimer', 'Chronograph'],
  },
]

function formatPrice(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value)
  }

  return typeof value === 'string' && value.trim() ? value : 'Price unavailable'
}

function isLikelyPriceLabel(value) {
  return typeof value === 'string' && /[$€£¥]|USD|EUR|GBP|JPY/i.test(value)
}

function parsePriceValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value !== 'string') {
    return 0
  }

  const cleaned = value.replace(/,/g, '')
  const match = cleaned.match(/\$?\s*([\d]+(?:\.\d+)?)/)

  if (!match) {
    return 0
  }

  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrencyTotal(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function normalizeWatch(item, fallback = {}) {
  const title =
    item?.title ||
    [item?.brand, item?.model].filter(Boolean).join(' ') ||
    fallback.title ||
    'Unnamed watch'

  const detailValue =
    item?.priceLabel ||
    (isLikelyPriceLabel(item?.detail) ? item.detail : '') ||
    formatPrice(item?.price) ||
    (isLikelyPriceLabel(fallback.detail) ? fallback.detail : '') ||
    fallback.detail ||
    'Price unavailable'

  const meta = Array.isArray(item?.meta) ? item.meta.filter(Boolean) : fallback.meta || []

  return {
    title,
    badge: item?.badge || fallback.badge || item?.brand || 'Watch',
    brand: item?.brand || fallback.brand || 'Watch',
    model: item?.model || fallback.model || title,
    detail: detailValue,
    priceLabel: detailValue,
    description:
      item?.description ||
      fallback.description ||
      'No watch description was returned yet.',
    meta,
    imageSrc: item?.imageUrl || item?.imageSrc || fallback.imageSrc || '',
    imageAlt: item?.imageAlt || fallback.imageAlt || title,
    sourceUrl: item?.sourceUrl || fallback.sourceUrl || '',
  }
}

async function fetchWatchCards(params = {}) {
  const searchParams = new URLSearchParams()

  if (params.query) {
    searchParams.set('q', params.query)
  }

  if (params.limit) {
    searchParams.set('limit', String(params.limit))
  }

  if (params.mode) {
    searchParams.set('mode', params.mode)
  }

  const response = await fetch(`/.netlify/functions/watch-search?${searchParams.toString()}`)

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || ''
    const errorBody = contentType.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text().catch(() => '')
    const message =
      (typeof errorBody === 'object' && errorBody?.error?.message) ||
      (typeof errorBody === 'string' && errorBody.trim().startsWith('<')
        ? 'The watch search route returned HTML instead of JSON. Run the app with Netlify Dev or use the Vite dev middleware.'
        : null) ||
      `Request failed with status ${response.status}`
    throw new Error(message)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('The watch search route returned HTML instead of JSON.')
  }

  const data = await response.json()
  return Array.isArray(data?.data) ? data.data : []
}

function App() {
  const [featuredWatches, setFeaturedWatches] = useState(showcaseSeeds)
  const [searchValue, setSearchValue] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingShowcase, setIsLoadingShowcase] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [savedCollection, setSavedCollection] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
  const [view, setView] = useState('home')
  const [selectedWatch, setSelectedWatch] = useState(null)

  const showingSearchResults = activeQuery.trim().length > 0
  const collectionTotal = useMemo(
    () =>
      savedCollection.reduce((sum, watch) => {
        const price = parsePriceValue(watch.detail || watch.priceLabel || watch.price)
        return sum + price
      }, 0),
    [savedCollection],
  )

  useEffect(() => {
    let cancelled = false

    async function loadShowcase() {
      setIsLoadingShowcase(true)

      try {
        const items = await fetchWatchCards({ mode: 'showcase', limit: 3 })

        if (!cancelled && items.length > 0) {
          setFeaturedWatches(
            items.map((item, index) => normalizeWatch(item, showcaseSeeds[index] || {})),
          )
        }
      } catch {
        if (!cancelled) {
          setFeaturedWatches(showcaseSeeds)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingShowcase(false)
        }
      }
    }

    loadShowcase()

    return () => {
      cancelled = true
    }
  }, [])

  function saveWatch(setter, watch) {
    setter((current) => {
      if (current.some((item) => item.title === watch.title)) {
        return current
      }

      return [...current, watch]
    })
  }

  function removeWatch(setter, watchTitle) {
    setter((current) => current.filter((item) => item.title !== watchTitle))
  }

  function addToCollection(watch) {
    saveWatch(setSavedCollection, watch)
    removeWatch(setWishlistItems, watch.title)
  }

  function addToWishlist(watch) {
    saveWatch(setWishlistItems, watch)
    removeWatch(setSavedCollection, watch.title)
  }

  function moveToCollection(watch) {
    addToCollection(watch)
  }

  function removeFromWishlist(watchTitle) {
    removeWatch(setWishlistItems, watchTitle)
  }

  function removeFromCollection(watchTitle) {
    removeWatch(setSavedCollection, watchTitle)
  }

  function openRetailerFinder(watch) {
    setSelectedWatch(watch)
  }

  function closeRetailerFinder() {
    setSelectedWatch(null)
  }

  function isSaved(list, watchTitle) {
    return list.some((item) => item.title === watchTitle)
  }

  async function runSearch(query) {
    if (!query) {
      setSearchResults([])
      setActiveQuery('')
      setSearchError('')
      return
    }

    setIsSearching(true)
    setSearchError('')
    setActiveQuery(query)

    try {
      const items = await fetchWatchCards({ query, limit: 6 })
      setSearchResults(items.map((item) => normalizeWatch(item)))
    } catch (error) {
      setSearchResults([])
      setSearchError(
        error instanceof Error ? error.message : 'Unable to search watches right now.',
      )
    } finally {
      setIsSearching(false)
    }
  }

  async function handleSearchSubmit(event) {
    event.preventDefault()

    await runSearch(searchValue.trim())
  }

  return (
    <div className="app-shell">
      <Nav
        searchValue={searchValue}
        onSearchChange={(event) => setSearchValue(event.target.value)}
        onSearchSubmit={handleSearchSubmit}
        onGoCollection={() => setView('collection')}
        onGoWishlist={() => setView('wishlist')}
        onGoHome={() => setView('home')}
      />

      <main className="page-content">
        {view === 'collection' ? (
          <Collection
            items={savedCollection}
            totalValue={formatCurrencyTotal(collectionTotal)}
            emptyText="Add a watch to Collection to keep it here."
            title="My Collection"
            description="Every great collection starts with a single piece and grows into something unforgettable."
            onRemove={(watchTitle) => removeWatch(setSavedCollection, watchTitle)}
          />
        ) : view === 'wishlist' ? (
          <Wishlist
            items={wishlistItems}
            emptyText="Add a watch to Wish List to save it here."
            title="Wish List"
            description="Keep the watches that inspire you close, and let your next favorite find its way here."
            onMoveToCollection={moveToCollection}
            onFindWatch={openRetailerFinder}
            onRemoveFromWishlist={(watchTitle) => removeFromWishlist(watchTitle)}
          />
        ) : (
          <>
            <section className="hero">
              <p className="eyebrow">Luxury Time Pieces</p>
              <h1>Timeless pieces, built to stand out.</h1>
              <p className="hero-copy">
                Welcome in. I’m here to help you discover watches you’ll love and build a
                collection that tells your story.
              </p>
            </section>

            {isLoadingShowcase ? <p className="status-message">Loading showcase watches...</p> : null}

            <section id="collection" className="watch-grid" aria-label="Luxury Time Pieces">
              {featuredWatches.map((watch) => (
                <WatchCard
                  key={watch.title}
                  {...watch}
                  actionMode="full"
                  isInCollection={isSaved(savedCollection, watch.title)}
                  isInWishlist={isSaved(wishlistItems, watch.title)}
                  onFind={() => openRetailerFinder(watch)}
                  onAddToCollection={() => addToCollection(watch)}
                  onRemoveFromCollection={() => removeFromCollection(watch.title)}
                  onAddToWishlist={() => addToWishlist(watch)}
                  onRemoveFromWishlist={() => removeFromWishlist(watch.title)}
                />
              ))}
            </section>

            {isSearching ? <p className="status-message">Searching watches...</p> : null}
            {searchError ? <p className="status-message status-message--error">{searchError}</p> : null}

            {showingSearchResults ? (
              <section className="results-section" aria-label="Search results">
                <div className="results-header">
                  <p className="eyebrow">Search Results</p>
                  <p className="results-query">For "{activeQuery}"</p>
                </div>

                {!isSearching && !searchError && searchResults.length === 0 ? (
                  <p className="status-message">
                    No watches found for "{activeQuery}". Try adding a model name like Daytona or
                    Seamaster.
                  </p>
                ) : null}

                <div className="watch-grid">
                  {searchResults.map((watch, index) => (
                    <WatchCard
                      key={`${watch.title}-${index}`}
                      {...watch}
                      actionMode="full"
                      isInCollection={isSaved(savedCollection, watch.title)}
                      isInWishlist={isSaved(wishlistItems, watch.title)}
                      onFind={() => openRetailerFinder(watch)}
                      onAddToCollection={() => addToCollection(watch)}
                      onRemoveFromCollection={() => removeFromCollection(watch.title)}
                      onAddToWishlist={() => addToWishlist(watch)}
                      onRemoveFromWishlist={() => removeFromWishlist(watch.title)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </main>

      {selectedWatch ? (
        <RetailerFinderModal watch={selectedWatch} onClose={closeRetailerFinder} />
      ) : null}
    </div>
  )
}

export default App
