import WatchCard from './watchcard.jsx'

export default function Collection({
  items,
  totalValue,
  emptyText,
  title,
  description,
  onRemove,
}) {
  return (
    <section className="collection-page" aria-label="Collection page">
      <div className="collection-page__header">
        <div>
          <p className="eyebrow">{title}</p>
          <h1 className="collection-page__title">"{description}"</h1>
        </div>

        <article className="collection-total-card" aria-label="Total collection value">
          <p className="collection-total-card__label">Total Collection Value</p>
          <p className="collection-total-card__value">{totalValue}</p>
          <p className="collection-total-card__meta">
            {items.length} piece{items.length === 1 ? '' : 's'} collected
          </p>
        </article>
      </div>

      {items.length > 0 ? (
        <div className="watch-grid">
          {items.map((watch, index) => (
            <WatchCard
              key={watch.title}
              {...watch}
              actionMode="remove"
              imageLoading={index === 0 ? 'eager' : 'lazy'}
              imageFetchPriority={index === 0 ? 'high' : 'auto'}
              onRemoveFromCollection={() => onRemove(watch.title)}
            />
          ))}
        </div>
      ) : (
        <div className="saved-panel">
          <p className="wishlist-copy">{emptyText}</p>
        </div>
      )}
    </section>
  )
}
