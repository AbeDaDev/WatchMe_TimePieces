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

  return (
    <article className="watch-card">
      <div className="watch-card__top">
        <span className="watch-tag">{badge}</span>
        <span className="watch-price">{visiblePrice}</span>
      </div>

      <div className={`watch-visual${imageSrc ? ' watch-visual--image' : ''}`}>
        {imageSrc ? (
          <img
            className="watch-image"
            src={imageSrc}
            alt={imageAlt || title}
            loading={imageLoading}
            fetchPriority={imageFetchPriority}
            decoding="async"
          />
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
