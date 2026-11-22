import api from "./api";

// Payment & Subscription API Service
// Handles plan retrieval, checkout processing, subscription status, and admin transaction logs

export const paymentService = {
  // Public / Business Owner: Get available plans & pricing
  async getPlans() {
    const response = await api.get("/payments/plans");
    return response.data;
  },

  // Business Owner: Get current active plan & billing history
  async getCurrentSubscription() {
    const response = await api.get("/payments/my-subscription");
    return response.data;
  },

  // Business Owner: Process payment & upgrade subscription
  async subscribe(paymentData) {
    const response = await api.post("/payments/subscribe", paymentData);
    return response.data;
  },

  // Business Owner: Cancel auto-renewal / downgrade to Free
  async cancelSubscription() {
    const response = await api.patch("/payments/cancel");
    return response.data;
  },

  // Admin: Get all platform transaction history and revenue metrics
  async getAdminTransactions() {
    const response = await api.get("/payments/admin/transactions");
    return response.data;
  }
};

export default paymentService;
