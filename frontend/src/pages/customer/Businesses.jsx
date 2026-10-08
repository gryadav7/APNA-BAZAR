import{Link } from "react-router-dom";

const businesses = [
    {
        id:1,
        name: "Prashant Hair Stusdio ",
        category: "Salon & Beauty ",
        location:"Ghaziabad",
        rating:4.5 ,
    },
    {
        id:2,
        name:"Raj Fitzone Gym",
        location:"Ghaziabad",
        rating:4.9,
    },
    {
        id:3 ,
        name:"Gangaram Food Corner",
        location:"Gurugram",
        rating:4.6 ,
    },
     {
    id: 4,
    name: "Care Clinic",
    category: "Healthcare",
    location: "Ghaziabad",
    rating: 4.6,
  },
  {
    id: 5,
    name: "Tech Academy",
    category: "Education",
    location: "Noida",
    rating: 4.4,
  },
  {
    id: 6,
    name: "HomeFix Services",
    category: "Home Services",
    location: "Delhi",
    rating: 4.2,
  },

];
function Businesses(){
    return(
        <main className="business-page">

      <section className="business-header">
        <h1>Explore Businesses</h1>

        <p>
          Find trusted local businesses and services near you.
        </p>

        <div className="business-search">
          <input
            type="text"
            placeholder="Search businesses..."
          />

          <select>
            <option value="">All Categories</option>
            <option value="salon">Salon & Beauty</option>
            <option value="fitness">Fitness</option>
            <option value="restaurant">Restaurant</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="home">Home Services</option>
          </select>

          <button>Search</button>
        </div>
      </section>

      <section className="business-results">

        <div className="results-header">
          <h2>Businesses Near You</h2>
          <span>{businesses.length} businesses found</span>
        </div>

        <div className="business-grid">

          {businesses.map((business) => (
            <div className="business-item" key={business.id}>

              <div className="business-image">
                🏪
              </div>

              <div className="business-info">
                <h3>{business.name}</h3>

                <p className="business-category">
                  {business.category}
                </p>

                <p>📍 {business.location}</p>

                <p>⭐ {business.rating}</p>

                <Link to={`/businesses/${business.id}`}>
                  View Business
                </Link>
              </div>

            </div>
          ))}

        </div>

      </section>

    </main>
    );
}
export default businesses;