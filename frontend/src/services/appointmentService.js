import api from "./api";

// Appointment API Service
// Connects with /api/appointments endpoints for customer bookings and business appointments

export const appointmentService = {
  // Customer: Create a new appointment
  // Payload: { businessId, serviceId, date: "YYYY-MM-DD", time: "HH:mm", notes?: string }
  async createAppointment({ businessId, serviceId, date, time, notes }) {
    const payload = {
      businessId,
      serviceId,
      date,
      time
    };
    if (notes && notes.trim()) {
      payload.notes = notes.trim();
    }
    const response = await api.post("/appointments", payload);
    return response.data;
  },

  // Customer: Get list of appointments for the logged-in customer
  async getMyAppointments() {
    const response = await api.get("/appointments/my-appointments");
    return response.data;
  },

  // Customer or Business Owner: Get details of a single appointment
  async getAppointmentById(appointmentId) {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Customer: Cancel an existing appointment
  async cancelAppointment(appointmentId) {
    const response = await api.patch(`/appointments/${appointmentId}/cancel`);
    return response.data;
  },

  // Business Owner: Get list of appointments booked at their business
  async getBusinessAppointments() {
    const response = await api.get("/appointments/business");
    return response.data;
  },

  // Business Owner: Accept or reject an appointment (CONFIRMED / REJECTED)
  async updateAppointmentStatus(appointmentId, status) {
    const response = await api.patch(`/appointments/${appointmentId}/status`, {
      status
    });
    return response.data;
  },

  // Business Owner: Mark a confirmed appointment as completed
  async completeAppointment(appointmentId) {
    const response = await api.patch(`/appointments/${appointmentId}/complete`);
    return response.data;
  }
};

export default appointmentService;
