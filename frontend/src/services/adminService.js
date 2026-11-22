import api from "./api";

// Admin API Service
// Connects with /api/admin endpoints for metrics, business moderation, user management, and appointments

export const adminService = {
  // Admin: Get platform overview metrics
  async getDashboardMetrics() {
    const response = await api.get("/admin/dashboard");
    return response.data;
  },

  // Admin: Get all registered businesses with optional query filters (status, category, city)
  async getAllBusinesses(params = {}) {
    const response = await api.get("/admin/businesses", { params });
    return response.data;
  },

  // Admin: Get single business details
  async getBusinessById(businessId) {
    const response = await api.get(`/admin/businesses/${businessId}`);
    return response.data;
  },

  // Admin: Update business status (ACTIVE, SUSPENDED, BLOCKED)
  async updateBusinessStatus(businessId, status) {
    const response = await api.patch(`/admin/businesses/${businessId}/status`, {
      status
    });
    return response.data;
  },

  // Admin: Permanently delete business and cascade delete services/availability
  async deleteBusiness(businessId) {
    const response = await api.delete(`/admin/businesses/${businessId}`);
    return response.data;
  },

  // Admin: Get all registered users (role filter, search query)
  async getAllUsers(params = {}) {
    const response = await api.get("/admin/users", { params });
    return response.data;
  },

  // Admin: Get user by ID
  async getUserById(userId) {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Admin: Block or unblock a user account (status: 'ACTIVE' | 'BLOCKED')
  async updateUserStatus(userId, status) {
    const response = await api.patch(`/admin/users/${userId}/status`, {
      status
    });
    return response.data;
  },

  // Admin: Permanently delete a user account and cascade clean their data
  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Admin: Get all appointments platform-wide (status filter, search query)
  async getAllAppointments(params = {}) {
    const response = await api.get("/admin/appointments", { params });
    return response.data;
  },

  // Admin: Update appointment status (PENDING, CONFIRMED, REJECTED, COMPLETED, CANCELLED)
  async updateAppointmentStatus(appointmentId, status) {
    const response = await api.patch(`/admin/appointments/${appointmentId}/status`, {
      status
    });
    return response.data;
  }
};

export default adminService;
