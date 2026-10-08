function Home() {
  return (
    <main className="home">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Find Local Businesses Near You</h1>

          <p>
            Discover trusted businesses, services and professionals
            in your area.
          </p>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search for a business or service..."
            />

            <input
              type="text"
              placeholder="Location"
            />

            <button>Search</button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories">
        <h2>Explore Categories</h2>

        <div className="category-list">
          <div className="category-card">🍔 Restaurants</div>
          <div className="category-card">💇 Salon & Beauty</div>
          <div className="category-card">🏋️ Fitness</div>
          <div className="category-card">🔧 Home Services</div>
          <div className="category-card">🩺 Healthcare</div>
          <div className="category-card">📚 Education</div>
        </div>
      </section>

      {/* Popular Businesses */}
      <section className="businesses">
        <h2>Popular Businesses</h2>

        <div className="business-list">

          <div className="business-card">
            <h3>Prashant  Hair Studio</h3>
            <p>Salon & Beauty</p>
            <p>📍 Ghaziabad</p>
            <button>View Business</button>
          </div>

          <div className="business-card">
            <h3>Raj FitZone Gym</h3>
            <p>Fitness</p>
            <p>📍 Noida</p>
            <button>View Business</button>
          </div>

          <div className="business-card">
            <h3> Gangaram Food Corner</h3>
            <p>Restaurant</p>
            <p>📍 Gurugram </p>
            <button>View Business</button>
          </div>

        </div>
      </section>

    </main>
  );
}

export default Home;