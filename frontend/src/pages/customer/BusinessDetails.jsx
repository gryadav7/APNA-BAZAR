import { useParams, Link } from "react-router-dom";

const businesses = [
  {
    id: 1,
    name: "Prashant Hair Studio",
    category: "Salon & Beauty",
    location: "Ghaziabad",
    rating: 4.5,
    description:
      "Professional hair styling, grooming and beauty services.",
    services: ["Haircut", "Hair Styling", "Hair Spa"],
  },
  {
    id: 2,
    name: " Raj FitZone Gym",
    category: "Fitness",
    location: "Noida",
    rating: 4.7,
    description:
      "Modern gym with professional trainers and fitness programs.",
    services: ["Gym Membership", "Personal Training", "Cardio"],
  },
  {
    id: 3,
    name: "Gangaram Food Corner",
    category: "Restaurant",
    location: "Gurugram",
    rating: 4.3,
    description:
      "Fresh and delicious food with a comfortable dining experience.",
    services: ["Dine In", "Takeaway", "Home Delivery"],
  },
];

function BusinessDetails() {
  const { id } = useParams();

  const business = businesses.find(
    (item) => item.id === Number(id)
  );

  if (!business) {
    return (
      <div className="business-details">
        <h2>Business not found</h2>
        <Link to="/businesses">Back to Businesses</Link>
      </div>
    );
  }

  return (
    <main className="business-details">

      <Link to="/businesses" className="back-link">
        ← Back to Businesses
      </Link>

      <section className="business-detail-card">

        <div className="business-detail-image">
          🏪
        </div>

        <div className="business-detail-content">

          <span className="business-category">
            {business.category}
          </span>

          <h1>{business.name}</h1>

          <p>📍 {business.location}</p>

          <p>⭐ {business.rating}</p>

          <p className="business-description">
            {business.description}
          </p>

          <h2>Services</h2>

          <div className="service-list">
            {business.services.map((service) => (
              <div className="service-item" key={service}>
                {service}
              </div>
            ))}
          </div>

          <Link
            to={`/appointments?business=${business.id}`}
            className="book-btn"
          >
            Book Appointment
          </Link>

        </div>

      </section>

    </main>
  );
}

export default BusinessDetails;