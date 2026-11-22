import { useLocation, Link } from "react-router-dom";

function ComingSoon() {
  const location = useLocation();

  const pageName = location.pathname
    .split("/")
    .filter(Boolean)
    .pop()
    .replace(/-/g, " ");

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "25px"
    }}>
      <div style={{
        background: "#FFFFFF",
        padding: "45px 30px",
        borderRadius: "20px",
        textAlign: "center",
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 8px 30px rgba(30,30,70,0.06)"
      }}>
        <div style={{
          fontSize: "55px",
          marginBottom: "15px"
        }}>
          🚀
        </div>

        <h1 style={{
          color: "#6258E8",
          textTransform: "capitalize"
        }}>
          {pageName}
        </h1>

        <h3 style={{ color: "#202238" }}>
          Coming Soon!
        </h3>

        <p style={{
          color: "#777B91",
          lineHeight: 1.7
        }}>
          This section is currently under development.
          We are working to bring you an amazing experience.
        </p>

        <Link to="/" style={{
          display: "inline-block",
          marginTop: "15px",
          padding: "13px 24px",
          background: "#6258E8",
          color: "#FFFFFF",
          borderRadius: "10px",
          textDecoration: "none",
          fontWeight: "600"
        }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default ComingSoon;