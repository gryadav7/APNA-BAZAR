import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/customer/Home.jsx";
import Businesses from "./pages/customer/Businesses.jsx";
import Navbar from "./components/Navbar.jsx";
import "./App.css";
import BusinessDetails from "./pages/customer/BusinessDetails.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/businesses" element={<Businesses />} />
        <Route
  path="/businesses/:id"
  element={<BusinessDetails />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;