import api from "./api";

// Business Availability API Service
// Connects with /api/availability for weekly operating schedules

export const availabilityService = {
  // Get logged-in business owner's availability schedule
  async getMyAvailability() {
    const response = await api.get("/availability");
    return response.data;
  },

  // Create availability for a specific weekday
  async createAvailability({ day, isOpen, openingTime, closingTime }) {
    const payload = {
      day: day.toUpperCase(),
      isOpen
    };
    if (isOpen) {
      payload.openingTime = openingTime;
      payload.closingTime = closingTime;
    }
    const response = await api.post("/availability", payload);
    return response.data;
  },

  // Update availability for a specific weekday
  async updateAvailability(day, { isOpen, openingTime, closingTime }) {
    const payload = {
      isOpen
    };
    if (isOpen) {
      payload.openingTime = openingTime;
      payload.closingTime = closingTime;
    }
    const response = await api.put(`/availability/${day.toUpperCase()}`, payload);
    return response.data;
  },

  // Delete availability record for a specific weekday
  async deleteAvailability(day) {
    const response = await api.delete(`/availability/${day.toUpperCase()}`);
    return response.data;
  }
};

export default availabilityService;
