import axios from "axios";

// Centralized Axios instance for APNA-BAZAR
// Configured to automatically send and receive HTTP-Only authentication cookies

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for JWT HTTP-only cookies
  headers: {
    "Content-Type": "application/json"
  }
});

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error message extraction
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected error occurred.";
    
    return Promise.reject({
      ...error,
      customMessage: message,
      status: error.response?.status
    });
  }
);

export default api;
