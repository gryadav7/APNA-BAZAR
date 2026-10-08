import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">
        APNA <span>BAZAR</span>
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/businesses">Businesses</Link>
        <Link to="/favorites">Favorites</Link>
        <Link to="/appointments">Appointments</Link>
        <Link to="/profile">Profile</Link>
      </div>

      <Link to="/login" className="login-btn">
        Login
      </Link>
    </nav>
  );
}

export default Navbar;