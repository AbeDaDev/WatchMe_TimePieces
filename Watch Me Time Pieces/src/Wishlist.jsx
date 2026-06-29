import WatchCard from './watchcard.jsx'

export default function Wishlist({
  items,
  emptyText,
  title,
  description,
  onMoveToCollection,
  onFindWatch,
  onRemoveFromWishlist,
}) {
  return (
    <section className="collection-page" aria-label="Wishlist page">
      <div className="collection-page__header">
        <div>
          <p className="eyebrow">{title}</p>
          <h1 className="collection-page__title">"{description}"</h1>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="watch-grid">
          {items.map((watch) => (
            <WatchCard
              key={watch.title}
              {...watch}
              actionMode="wishlist"
              onFind={() => onFindWatch(watch)}
              onAddToCollection={() => onMoveToCollection(watch)}
              onRemoveFromWishlist={() => onRemoveFromWishlist(watch.title)}
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
