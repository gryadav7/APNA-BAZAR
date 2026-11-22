import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

// Auth Provider Context
import { AuthProvider } from "./context/AuthContext";

// Layouts
import CustomerLayout from "./layouts/CustomerLayout";
import BusinessLayout from "./layouts/BusinessLayout";
import AdminLayout from "./layouts/AdminLayout";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";

// Lazy-Loaded Authentication Pages
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));

// Lazy-Loaded Customer Marketplace Pages
const Home = lazy(() => import("./pages/customer/Home"));
const Explore = lazy(() => import("./pages/customer/Explore"));
const BusinessDetails = lazy(() => import("./pages/customer/BusinessDetails"));
const BookAppointment = lazy(() => import("./pages/customer/BookAppointment"));
const MyAppointments = lazy(() => import("./pages/customer/MyAppointments"));
const AppointmentDetails = lazy(() => import("./pages/customer/AppointmentDetails"));
const Profile = lazy(() => import("./pages/customer/Profile"));

// Lazy-Loaded Business Owner Pages
const BusinessDashboard = lazy(() => import("./pages/business/Dashboard"));
const ManageBusiness = lazy(() => import("./pages/business/ManageBusiness"));
const ManageServices = lazy(() => import("./pages/business/ManageServices"));
const Availability = lazy(() => import("./pages/business/Availability"));
const BusinessAppointments = lazy(() => import("./pages/business/Appointments"));
const BusinessCustomers = lazy(() => import("./pages/business/Customers"));
const BusinessSubscription = lazy(() => import("./pages/business/Subscription"));

// Lazy-Loaded Admin Pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminBusinesses = lazy(() => import("./pages/admin/Businesses"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminAppointments = lazy(() => import("./pages/admin/Appointments"));
const AdminTransactions = lazy(() => import("./pages/admin/Transactions"));

// Fallback & Status Pages
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoading() {
  return <Loader fullPage text="Loading page..." />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoading />}>
          <Routes>

            {/* ============================================================== */}
            {/* PUBLIC CUSTOMER MARKETPLACE ROUTES */}
            {/* ============================================================== */}
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/business/:businessId" element={<BusinessDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ============================================================== */}
              {/* PROTECTED CUSTOMER ROUTES (ROLE: CUSTOMER) */}
              {/* ============================================================== */}
              <Route element={<ProtectedRoute allowedRoles={["CUSTOMER"]} />}>
                <Route
                  path="/book/:businessId"
                  element={<BookAppointment />}
                />
                <Route
                  path="/my-appointments"
                  element={<MyAppointments />}
                />
                <Route
                  path="/appointments"
                  element={<Navigate to="/my-appointments" replace />}
                />
                <Route
                  path="/appointment/:appointmentId"
                  element={<AppointmentDetails />}
                />
                <Route
                  path="/appointments/:appointmentId"
                  element={<AppointmentDetails />}
                />
                <Route
                  path="/profile"
                  element={<Profile />}
                />
              </Route>
            </Route>

            {/* ============================================================== */}
            {/* PROTECTED BUSINESS OWNER ROUTES (ROLE: BUSINESS_OWNER) */}
            {/* ============================================================== */}
            <Route element={<ProtectedRoute allowedRoles={["BUSINESS_OWNER"]} />}>
              <Route path="/business" element={<BusinessLayout />}>
                <Route
                  index
                  element={<Navigate to="dashboard" replace />}
                />
                <Route
                  path="dashboard"
                  element={<BusinessDashboard />}
                />
                <Route path="manage" element={<ManageBusiness />} />
                <Route path="services" element={<ManageServices />} />
                <Route path="availability" element={<Availability />} />
                <Route path="appointments" element={<BusinessAppointments />} />
                <Route path="customers" element={<BusinessCustomers />} />
                <Route path="subscription" element={<BusinessSubscription />} />
              </Route>
            </Route>

            {/* ============================================================== */}
            {/* DEDICATED ADMIN AUTHENTICATION */}
            {/* ============================================================== */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* ============================================================== */}
            {/* PROTECTED ADMIN ROUTES (ROLE: ADMIN) */}
            {/* ============================================================== */}
            <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route
                  index
                  element={<Navigate to="dashboard" replace />}
                />
                <Route
                  path="dashboard"
                  element={<AdminDashboard />}
                />
                <Route path="users" element={<AdminUsers />} />
                <Route path="businesses" element={<AdminBusinesses />} />
                <Route path="appointments" element={<AdminAppointments />} />
                <Route path="transactions" element={<AdminTransactions />} />
              </Route>
            </Route>

            {/* ============================================================== */}
            {/* 404 NOT FOUND ROUTE */}
            {/* ============================================================== */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
