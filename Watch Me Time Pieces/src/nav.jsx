export default function Nav({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onGoCollection,
  onGoWishlist,
  onGoHome,
}) {
  return (
    <header className="nav">
      <button type="button" className="brand brand-button" onClick={onGoHome}>
        WatchMe
      </button>

      <nav className="nav-tabs" aria-label="Primary">
        <ul className="nav-links">
          <li>
            <button type="button" className="nav-link-button" onClick={onGoHome}>
              Home
            </button>
          </li>
          <li>
            <button type="button" className="nav-link-button" onClick={onGoCollection}>
              Collection
            </button>
          </li>
          <li>
            <button type="button" className="nav-link-button" onClick={onGoWishlist}>
              Wish List
            </button>
          </li>
          <li className="nav-search">
            <form className="search-form" onSubmit={onSearchSubmit}>
              <label className="sr-only" htmlFor="watch-search">
                Search watches
              </label>
              <input
                id="watch-search"
                name="watch-search"
                type="search"
                placeholder="Search watches"
                aria-label="Search watches"
                value={searchValue}
                onChange={onSearchChange}
              />
            </form>
          </li>
        </ul>
      </nav>
    </header>
  )
}
