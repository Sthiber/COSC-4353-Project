import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import CompleteProfile from "../pages/CompleteProfile.jsx";
// Leo Nguyen - import login and register pages
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import VolunteerMatchingForm from "../pages/VolunteerMatchingForm.jsx";
import EventManagement from "../pages/EventManagement.jsx";
import AdminPage from "../pages/AdminPage.jsx";
import ManageUsers from "../pages/ManageUsers.jsx";
import "./index.css";
import VolunteerHistoryPage from "../pages/VolunteerHistoryPage.jsx";
import ScrollToTop from "../components/CompleteProfile/ScrollToTop.jsx";
import VolunteerDashboard from "../pages/VolunteerDashboard.jsx";

function RequireAuth({ children, role }) {
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Place Public Routes Here */}
        <Route path="/" element={<HomePage />} />

        {/* Leo Nguyen - added login and registration routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
          path="/event-management"
          element={
            <RequireAuth>
              <EventManagement />
            </RequireAuth>
          }
        />
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
        <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
        <Route
          path="/admin/volunteer-dashboard"
          element={
            <RequireAuth role="admin">
              <VolunteerDashboard />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
