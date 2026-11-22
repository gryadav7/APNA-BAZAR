import api from "./api";

// Customer Service
// Manages customer profile (User model + CustomerProfile model)

export const customerService = {
  // Get customer profile (combined User + CustomerProfile)
  async getProfile() {
    try {
      const response = await api.get("/customers/profile");
      return response.data;
    } catch (error) {
      // If /customers/profile is not yet implemented, fetch /auth/me for base user details
      if (error.status === 404 || !error.status) {
        const fallback = await api.get("/auth/me");
        return {
          success: true,
          user: fallback.data?.user,
          profile: null,
          isProfileApiAwaiting: true
        };
      }
      throw error;
    }
  },

  // Update customer profile
  async updateProfile(profileData) {
    const response = await api.put("/customers/profile", profileData);
    return response.data;
  }
};

export default customerService;
