import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.fontFamily =
  "Inter, Arial, sans-serif";
document.body.style.background = "#F8F8FC";

document.documentElement.style.scrollBehavior = "smooth";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);