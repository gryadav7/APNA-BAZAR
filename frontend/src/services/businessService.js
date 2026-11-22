import api from "./api";

// Business API Service
// Handles public discovery, featured businesses, categories, single profile, services, owner business management, dashboard, and customer directory

export const businessService = {
  // Public: Fetch list of active businesses with optional query filters
  async getBusinesses(params = {}) {
    const response = await api.get("/business", { params });
    return response.data;
  },

  // Public: Fetch featured businesses for customer homepage
  async getFeaturedBusinesses(limit = 4) {
    const response = await api.get("/business", {
      params: { limit, status: "ACTIVE" }
    });
    return response.data;
  },

  // Public: Fetch single business details by ID
  async getBusinessById(businessId) {
    const response = await api.get(`/business/${businessId}`);
    return response.data;
  },

  // Public: Fetch public services offered by a specific business
  async getBusinessServices(businessId) {
    const response = await api.get(`/business/${businessId}/services`);
    return response.data;
  },

  // Public: Fetch public categories supported by registered businesses
  async getCategories() {
    const response = await api.get("/business/categories");
    return response.data;
  },

  // Business Owner: Get logged-in owner's business profile
  async getMyBusiness() {
    const response = await api.get("/business/my-business");
    return response.data;
  },

  // Business Owner: Create initial business profile
  async createBusiness(businessData) {
    const response = await api.post("/business", businessData);
    return response.data;
  },

  // Business Owner: Update existing business profile
  async updateMyBusiness(updates) {
    const response = await api.put("/business/my-business", updates);
    return response.data;
  },

  // Business Owner: Fetch services belonging to logged-in owner's business
  async getMyServices() {
    const response = await api.get("/business/my-business/services");
    return response.data;
  },

  // Business Owner: Add a new service to logged-in owner's business
  async createService(serviceData) {
    const response = await api.post("/business/my-business/services", serviceData);
    return response.data;
  },

  // Business Owner: Update existing service
  async updateService(serviceId, serviceData) {
    const response = await api.put(`/business/my-business/services/${serviceId}`, serviceData);
    return response.data;
  },

  // Business Owner: Delete a service
  async deleteService(serviceId) {
    const response = await api.delete(`/business/my-business/services/${serviceId}`);
    return response.data;
  },

  // Business Owner: Fetch owner dashboard statistics and recent appointments
  async getDashboard() {
    const response = await api.get("/business/dashboard");
    return response.data;
  },

  // Business Owner: Fetch list of unique customers who booked appointments
  async getCustomers() {
    const response = await api.get("/business/customers");
    return response.data;
  },

  // Business Owner: Fetch single customer details & booking history
  async getCustomerById(customerId) {
    const response = await api.get(`/business/customers/${customerId}`);
    return response.data;
  }
};

export default businessService;
