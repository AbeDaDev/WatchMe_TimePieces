import { useEffect, useState } from 'react'

export default function WatchCard({
  title,
  brand,
  model,
  badge,
  detail,
  priceLabel,
  description,
  meta = [],
  imageSrc = '',
  imageAlt = '',
  imageLoading = 'lazy',
  imageFetchPriority = 'auto',
  onAddToCollection,
  onAddToWishlist,
  onRemoveFromWishlist,
  onFind,
  onRemoveFromCollection,
  actionMode = 'full',
  isInCollection = false,
  isInWishlist = false,
}) {
  const visiblePrice = priceLabel || detail || 'Value unavailable'
  const visibleModel = model || title
  const [imageStatus, setImageStatus] = useState(imageSrc ? 'loading' : 'idle')
  const showImageLoader = imageSrc && imageStatus !== 'loaded'

  useEffect(() => {
    if (!imageSrc) {
      setImageStatus('idle')
      return undefined
    }

    let cancelled = false
    const image = new Image()

    const markLoaded = () => {
      if (!cancelled) {
        setImageStatus('loaded')
      }
    }

    const markError = () => {
      if (!cancelled) {
        setImageStatus('error')
      }
    }

    setImageStatus('loading')
    image.onload = markLoaded
    image.onerror = markError
    image.src = imageSrc

    if (image.complete) {
      markLoaded()
    }

    return () => {
      cancelled = true
    }
  }, [imageSrc])

  return (
    <article className="watch-card">
      <div className="watch-card__top">
        <span className="watch-tag">{badge}</span>
        <span className="watch-price">{visiblePrice}</span>
      </div>

      <div
        className={`watch-visual${imageSrc ? ' watch-visual--image' : ''}${
          imageStatus === 'loading' ? ' watch-visual--loading' : ''
        }${imageStatus === 'loaded' ? ' watch-visual--loaded' : ''}${
          imageStatus === 'error' ? ' watch-visual--error' : ''
        }`}
      >
        {imageSrc ? (
          <>
            <img
              className={`watch-image${imageStatus === 'loaded' ? ' watch-image--loaded' : ''}`}
              src={imageSrc}
              alt={imageAlt || title}
              loading={imageLoading}
              fetchPriority={imageFetchPriority}
              decoding="async"
            />
            {showImageLoader ? (
              <div className="watch-loader" aria-hidden={imageStatus !== 'error'}>
                {imageStatus === 'loading' ? (
                  <>
                    <div className="watch-loader__ring" />
                    <div className="watch-loader__dial">
                      <div className="watch-hand watch-hand--hour" />
                      <div className="watch-hand watch-hand--minute" />
                      <div className="watch-center" />
                    </div>
                  </>
                ) : null}
                {imageStatus === 'error' ? (
                  <p className="watch-loader__label" aria-live="polite">
                    Image unavailable
                  </p>
                ) : (
                  <p className="watch-loader__label" aria-live="polite">
                    Loading watch image...
                  </p>
                )}
              </div>
            ) : null}
          </>
        ) : (
          <div className="watch-visual__fallback" aria-hidden="true">
            <div className="watch-ring" />
            <div className="watch-face">
              <div className="watch-hand watch-hand--hour" />
              <div className="watch-hand watch-hand--minute" />
              <div className="watch-center" />
            </div>
          </div>
        )}
      </div>

      <p className="watch-brand">{brand}</p>
      <h2>{visibleModel}</h2>
      {meta.length > 0 ? <p className="watch-meta">{meta.join(' • ')}</p> : null}
      <p>{description}</p>

      {actionMode === 'full' ? (
        <div className="watch-actions">
          <button type="button" className="watch-button watch-button--primary" onClick={onFind}>
            Find
          </button>
          <button
            type="button"
            className="watch-button"
            onClick={isInCollection ? onRemoveFromCollection : onAddToCollection}
          >
            {isInCollection ? 'Remove from Collection' : 'Add to Collection'}
          </button>
          <button
            type="button"
            className="watch-button watch-button--secondary"
            onClick={isInWishlist ? onRemoveFromWishlist : onAddToWishlist}
          >
            {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </button>
        </div>
      ) : actionMode === 'remove' ? (
        <div className="watch-actions">
          <button
            type="button"
            className="watch-button watch-button--secondary"
            onClick={onRemoveFromCollection}
          >
            Remove from Collection
          </button>
        </div>
      ) : actionMode === 'wishlist' ? (
        <div className="watch-actions">
          <button type="button" className="watch-button watch-button--primary" onClick={onFind}>
            Find
          </button>
          <button type="button" className="watch-button" onClick={onAddToCollection}>
            Add to Collection
          </button>
          <button
            type="button"
            className="watch-button watch-button--secondary"
            onClick={onRemoveFromWishlist}
          >
            Remove from Wishlist
          </button>
        </div>
      ) : null}
    </article>
  )
}
