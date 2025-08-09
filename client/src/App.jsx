// App.jsx
// Leo Nguyen – Added react-hot-toast provider for global toasts

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";                 // Leo Nguyen – toast provider
import HomePage from "../pages/HomePage.jsx";
import CompleteProfile from "../pages/CompleteProfile.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import NotificationsPage from "../pages/NotificationsPage.jsx";
import VolunteerMatchingForm from "../pages/VolunteerMatchingForm.jsx";
import EventManagement from "../pages/EventManagement.jsx";
import AdminPage from "../pages/AdminPage.jsx";
import ManageUsers from "../pages/ManageUsers.jsx";
import VolunteerHistoryPage from "../pages/VolunteerHistoryPage.jsx";
import ScrollToTop from "../components/CompleteProfile/ScrollToTop.jsx";
import VolunteerDashboard from "../pages/VolunteerDashboard.jsx";
import "./index.css";

function RequireAuth({ children, role }) {
    const stored = localStorage.getItem("user");
    const user   = stored ? JSON.parse(stored) : null;

    if (!user) return <Navigate to="/login" replace />;
    if (role && user.role !== role) return <Navigate to="/" replace />;
    return children;
}

export default function App() {
    return (
        <>
            {/* ------------ Routes ------------ */}
            <Router>
                <ScrollToTop />
                <Routes>
                    {/* public */}
                    <Route path="/"          element={<HomePage />} />
                    <Route path="/login"     element={<LoginPage />} />
                    <Route path="/register"  element={<RegisterPage />} />

                    {/* protected (any logged-in user) */}
                    <Route
                        path="/complete-profile"
                        element={
                            <RequireAuth>
                                <CompleteProfile />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/volunteer"
                        element={
                            <RequireAuth>
                                <VolunteerMatchingForm />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/volunteer-history"
                        element={
                            <RequireAuth>
                                <VolunteerHistoryPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/notifications"
                        element={
                            <RequireAuth>
                                <NotificationsPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/event-management"
                        element={
                            <RequireAuth>
                                <EventManagement />
                            </RequireAuth>
                        }
                    />

                    {/* admin only */}
                    <Route
                        path="/admin"
                        element={
                            <RequireAuth role="admin">
                                <AdminPage />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/manage-users"
                        element={
                            <RequireAuth role="admin">
                                <ManageUsers />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/admin/volunteer-dashboard"
                        element={
                            <RequireAuth role="admin">
                                <VolunteerDashboard />
                            </RequireAuth>
                        }
                    />

                    {/* dashboard accessible after login */}
                    <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
                </Routes>
            </Router>

            {/* ------------ Toast Portal ------------ */}
            {/* Leo Nguyen – global toaster (dark style) */}
            <Toaster
                position="top-right"
                toastOptions={{
                    style: { background: "#1a2035", color: "#fff" },
                }}
            />
        </>
    );
}
