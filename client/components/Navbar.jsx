// ... your existing imports remain the same
import { useState, useEffect } from "react";
import { Menu, X, Users } from "lucide-react";
import { Button } from "./ui/Button";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navbar({ scrollToSection }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleScroll = (section) => {
    if (scrollToSection) {
      scrollToSection(section);
    }
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("profileComplete");
    localStorage.removeItem("isLoggedIn");
    setUser(null);
    setIsMenuOpen(false);
    navigate("/");
  };

  const loggedIn = !!user;
  const isAdmin = user?.role === "admin";

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center"
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-semibold text-white">Volentra</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {!loggedIn && (
              <>
                <Link
                  to="/"
                  onClick={(e) => {
                    if (location.pathname === "/") {
                      e.preventDefault();
                      handleScroll("hero");
                    }
                  }}
                  className="text-gray-300 hover:text-blue-400 font-medium transition"
                >
                  Home
                </Link>
                <Link
                  to="/"
                  onClick={(e) => {
                    if (location.pathname === "/") {
                      e.preventDefault();
                      handleScroll("about");
                    }
                  }}
                  className="text-gray-300 hover:text-blue-400 font-medium transition"
                >
                  About
                </Link>
                <Link to="/login">
                  <Button className="text-gray-300 hover:text-blue-400 font-medium transition">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="text-gray-300 hover:text-blue-400 font-medium transition">
                    Register
                  </Button>
                </Link>
              </>
            )}

            {loggedIn && (
              <>
                {!isAdmin && (
                  <Link
                    to="/volunteer-dashboard"
                    className="text-gray-300 hover:text-blue-400 font-medium transition"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/complete-profile"
                  className="text-gray-300 hover:text-blue-400 font-medium transition"
                >
                  Profile
                </Link>
                <Link
                  to="/event-management"
                  className="text-gray-300 hover:text-blue-400 font-medium transition"
                >
                  Event Management
                </Link>

                {/* 🔹 New Volunteer Matching link (desktop) */}
                <Link
                  to="/volunteer"
                  className="text-gray-300 hover:text-blue-400 font-medium transition"
                >
                  Volunteer Matching
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      className="text-gray-300 hover:text-blue-400 font-medium transition"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/manage-users"
                      className="text-gray-300 hover:text-blue-400 font-medium transition"
                    >
                      Manage Users
                    </Link>
                  </>
                )}
                <Button onClick={handleLogout} className="text-gray-300 hover:text-red-400 transition">
                  Logout
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-blue-400 transition"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-gray-900">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {!loggedIn && location.pathname === "/" && (
                <>
                  <button
                    onClick={() => handleScroll("hero")}
                    className="block w-full text-left px-3 py-2 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => handleScroll("about")}
                    className="block w-full text-left px-3 py-2 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                  >
                    About
                  </button>
                  <Link to="/login">
                    <Button className="w-full text-blue-400 hover:bg-blue-500/10">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button className="w-full text-blue-400 hover:bg-blue-500/10">Register</Button>
                  </Link>
                </>
              )}

              {loggedIn && (
                <>
                  {!isAdmin && (
                    <Link
                      to="/volunteer-dashboard"
                      className="block px-3 py-2 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/complete-profile"
                    className="block px-3 py-2 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/event-management"
                    className="block px-3 py-2 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Event Management
                  </Link>

                  {/* 🔹 New Volunteer Matching link (mobile) */}
                  <Link
                    to="/volunteer"
                    className="block px-3 py-2 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Volunteer Matching
                  </Link>

                  {isAdmin && (
                    <>
                      <Link
                        to="/admin"
                        className="block px-3 py-2 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/manage-users"
                        className="block px-3 py-2 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Manage Users
                      </Link>
                      <Link
                        to="/admin/event-report"
                        className="block px-3 py-2 text-gray-300 hover:text-blue-400 hover:bg-gray-800 rounded-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Reports
                      </Link>
                    </>
                  )}
                  <div className="text-center">
                    <button
                      onClick={handleLogout}
                      className="text-red-400 hover:text-red-400 hover:bg-gray-800 px-3 py-2 rounded-md"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
