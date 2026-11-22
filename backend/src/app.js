import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import businessRoutes from "./routes/businessRoutes.js";
import businessDashboardRoutes from "./routes/businessDashboardRoutes.js";
import businessCustomerRoutes from "./routes/businessCustomerRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import customerDashboardRoutes from "./routes/customerDashboardRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import adminBusinessRoutes from "./routes/adminBusinessRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import adminAppointmentRoutes from "./routes/adminAppointmentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "LocalHub API is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/business/dashboard", businessDashboardRoutes);
app.use("/api/business/customers", businessCustomerRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/customers/dashboard", customerDashboardRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/businesses", adminBusinessRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/appointments", adminAppointmentRoutes);
app.use("/api/payments", paymentRoutes);

export default app;
