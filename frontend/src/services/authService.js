import api from "./api";

// Dedicated authentication service for APNA-BAZAR
// Communicates with /api/auth endpoints using HTTP-Only cookies

export const authService = {
  // Register a new customer or business owner
  async register(userData) {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  // Login with credentials; server sets HTTP-only JWT cookie
  async login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  // Logout; server clears HTTP-only JWT cookie
  async logout() {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  // Restore session: fetch logged-in user profile from JWT cookie
  async getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Test admin privilege (used by admin portal check)
  async verifyAdmin() {
    const response = await api.get("/auth/admin-test");
    return response.data;
  }
};

export default authService;
