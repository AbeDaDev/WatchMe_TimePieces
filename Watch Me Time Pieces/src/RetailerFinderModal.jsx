import { useEffect, useState } from 'react'

function formatDistance(distanceMiles) {
  if (typeof distanceMiles !== 'number' || Number.isNaN(distanceMiles)) {
    return 'Distance unavailable'
  }

  return `${distanceMiles.toFixed(1)} miles away`
}

export default function RetailerFinderModal({ watch, onClose }) {
  const [locationQuery, setLocationQuery] = useState('')
  const [status, setStatus] = useState('Locating your area...')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isUsingGeo, setIsUsingGeo] = useState(false)

  useEffect(() => {
    if (!watch) {
      return undefined
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [watch, onClose])

  useEffect(() => {
    if (!watch) {
      return
    }

    let cancelled = false

    async function locateAndSearch() {
      setError('')
      setResult(null)
      setLocationQuery('')
      setIsLoading(true)
      setStatus('Locating your area...')

      if (!navigator.geolocation) {
        setStatus('Enter a city or ZIP to search nearby retailers.')
        setIsLoading(false)
        return
      }

      setIsUsingGeo(true)

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (cancelled) {
            return
          }

          try {
            setStatus('Searching nearby retailers...')
            await lookupRetailer({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
            setStatus('Nearby retailer found.')
          } catch (lookupError) {
            if (!cancelled) {
              setError(lookupError instanceof Error ? lookupError.message : 'Search failed.')
            }
          } finally {
            if (!cancelled) {
              setIsLoading(false)
              setIsUsingGeo(false)
            }
          }
        },
        () => {
          if (cancelled) {
            return
          }

          setStatus('Location access was blocked. Enter a city or ZIP to search.')
          setIsLoading(false)
          setIsUsingGeo(false)
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
      )
    }

    async function lookupRetailer({ latitude, longitude, location }) {
      const params = new URLSearchParams({
        watch: watch.title,
      })

      if (typeof latitude === 'number' && typeof longitude === 'number') {
        params.set('lat', String(latitude))
        params.set('lng', String(longitude))
      } else if (location) {
        params.set('location', location)
      }

      const response = await fetch(`/.netlify/functions/find-retailer?${params.toString()}`)
      const contentType = response.headers.get('content-type') || ''
      const payload = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : null

      if (!response.ok) {
        const message =
          payload?.error?.message ||
          `Request failed with status ${response.status}`
        throw new Error(message)
      }

      setResult(payload?.retailer || null)
    }

    locateAndSearch()

    return () => {
      cancelled = true
    }
  }, [watch])

  async function handleManualSubmit(event) {
    event.preventDefault()

    const trimmed = locationQuery.trim()

    if (!trimmed) {
      setError('Enter a city or ZIP code to continue.')
      return
    }

    setError('')
    setStatus('Searching nearby retailers...')
    setIsLoading(true)

    try {
      const params = new URLSearchParams({
        watch: watch.title,
        location: trimmed,
      })

      const response = await fetch(`/.netlify/functions/find-retailer?${params.toString()}`)
      const contentType = response.headers.get('content-type') || ''
      const payload = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : null

      if (!response.ok) {
        const message =
          payload?.error?.message ||
          `Request failed with status ${response.status}`
        throw new Error(message)
      }

      setResult(payload?.retailer || null)
      setStatus('Nearby retailer found.')
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Search failed.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!watch) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="retailer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="retailer-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="retailer-modal__header">
          <div>
            <p className="eyebrow">Nearby Retailer</p>
            <h2 id="retailer-modal-title" className="retailer-modal__title">
              {watch.title}
            </h2>
          </div>
          <button type="button" className="watch-button watch-button--secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="retailer-modal__copy">
          We’re checking for a nearby retailer that carries this watch.
        </p>

        <form className="retailer-search-form" onSubmit={handleManualSubmit}>
          <label className="retailer-label" htmlFor="retailer-location">
            City or ZIP
          </label>
          <input
            id="retailer-location"
            className="retailer-input"
            type="text"
            placeholder="Enter city or ZIP"
            value={locationQuery}
            onChange={(event) => setLocationQuery(event.target.value)}
          />
          <button type="submit" className="watch-button watch-button--primary" disabled={isLoading && isUsingGeo}>
            Find retailer
          </button>
        </form>

        <p className="status-message">{status}</p>
        {error ? <p className="status-message status-message--error">{error}</p> : null}

        {result ? (
          <div className="retailer-result">
            <div className="retailer-result__top">
              <div>
                <p className="eyebrow">{result.retailerType || 'Retailer'}</p>
                <h3>{result.retailerName || 'Retailer found'}</h3>
              </div>
              <span className="watch-tag">{result.confidence || 'medium'}</span>
            </div>

            <p className="retailer-result__address">
              {[result.address, result.city, result.region, result.postalCode, result.country]
                .filter(Boolean)
                .join(', ')}
            </p>

            <div className="retailer-result__meta">
              <span>{formatDistance(result.distanceMiles)}</span>
              {result.phone ? <span>{result.phone}</span> : null}
            </div>

            {result.website ? (
              <a className="watch-button watch-button--primary retailer-link" href={result.website} target="_blank" rel="noreferrer">
                Visit Website
              </a>
            ) : null}

            {result.notes ? <p className="wishlist-copy">{result.notes}</p> : null}
            {result.sourceSummary ? <p className="retailer-source">{result.sourceSummary}</p> : null}
          </div>
        ) : null}
      </section>
    </div>
  )
}
