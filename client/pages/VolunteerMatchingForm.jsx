// VolunteerMatchingForm.jsx
// Locked userId (from localStorage) + no notification toggle.
// Click a match → jumps to dashboard Browse tab and auto-opens that event.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function VolunteerMatchingForm() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pull locked id from localStorage
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      toast.error("Please log in first.");
      navigate("/login");
    }
  }, [userId, navigate]);

  const handleFindMatches = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/match/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch matches");
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
      if (!data?.length) {
        toast("No matches found yet. Try updating your profile skills.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load matches.");
    } finally {
      setLoading(false);
    }
  };

  const openInDashboard = (eventId) => {
    // This makes the dashboard Browse tab open the exact event
    sessionStorage.setItem("selectedEventId", String(eventId));
    navigate("/volunteer-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-28 pb-12">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Volunteer Matching</h1>
          <p className="text-gray-300 mt-1">
            We’ll use your profile (location & skills) to find the best events for you.
          </p>
        </header>

        {/* Locked user info (not editable) */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="text-sm text-gray-400">Signed in as</div>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-indigo-400 font-semibold">Volunteer ID:</span>
            <span className="text-white">{userId || "—"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleFindMatches}
            disabled={loading || !userId}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg"
          >
            {loading ? "Finding matches..." : "Find Matches"}
          </button>

          <button
            onClick={() => navigate("/volunteer-dashboard")}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Results */}
        {matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((ev) => (
              <button
                key={ev.id || ev.event_id}
                onClick={() => openInDashboard(ev.id || ev.event_id)}
                className="text-left bg-[#1a2035] border border-gray-700 hover:border-indigo-600 rounded-xl p-4 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold">
                    {ev.title || ev.event_name || "Event"}
                  </h3>
                  <span className="text-xs bg-indigo-700/40 text-indigo-200 px-2 py-0.5 rounded">
                    Score: {ev.matchScore ?? "—"}
                  </span>
                </div>
                <div className="text-gray-300 text-sm">
                  {new Date(ev.startTime || ev.start_time).toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm mt-2">
                  {ev.location || ev.event_location}
                </div>
                {!!ev.matchedSkills?.length && (
                  <div className="mt-2 text-xs text-gray-300">
                    Matched skills: {ev.matchedSkills.join(", ")}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-gray-400">
            {loading ? "Fetching..." : "No matches yet. Click 'Find Matches' to start."}
          </div>
        )}
      </div>
    </div>
  );
}
