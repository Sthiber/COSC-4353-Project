// VolunteerMatchingForm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/Button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function VolunteerMatchingForm() {
  const navigate = useNavigate();
  const [volunteerId, setVolunteerId] = useState(
    localStorage.getItem("userId") || ""
  );
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [error, setError] = useState("");

  const findMatches = async () => {
    if (!volunteerId) {
      setError("Enter a volunteer ID.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/match/${volunteerId}`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Could not load matches. Try again.");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const showNotifications = async () => {
    if (!volunteerId) {
      setError("Enter a volunteer ID first.");
      return;
    }
    setError("");
    setNotifLoading(true);
    try {
      // nothing to fetch; just route to dashboard where the panel already loads
      navigate("/volunteer-dashboard");
    } finally {
      setNotifLoading(false);
    }
  };

  // when user clicks a suggested match card
  const goToBrowseEvent = (ev) => {
    // ev.id here is the DB event id returned by /api/match
    // make dashboard open Browse tab and the exact event detail
    localStorage.setItem("vd_jump_all_events", "1");        // your dashboard checks this to set activeSection
    localStorage.setItem("vd_scroll_to_event", String(ev.id));
    localStorage.setItem("vd_open_detail_event", String(ev.id));
    navigate("/volunteer-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-800 text-white pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto pt-28 px-4">
        <h1 className="text-3xl font-bold mb-2">Volunteer Matching</h1>
        <p className="text-gray-300 mb-8">
          Find events that fit your location and skills. We’ll also drop a
          notification when we find your best match.
        </p>

        {/* Controls */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6">
          <label className="block text-sm text-gray-300 mb-2">Volunteer ID</label>
          <div className="flex gap-3">
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={volunteerId}
              onChange={(e) => setVolunteerId(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter your volunteer ID"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <Button
              onClick={findMatches}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? "Loading..." : "Find Matches"}
            </Button>
            <Button
              onClick={showNotifications}
              disabled={notifLoading}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
             {notifLoading ? "Opening..." : "Show Notifications"}
            </Button>

          </div>

          {error && (
            <div className="mt-3 text-sm text-red-300 bg-red-900/30 border border-red-700 rounded p-2">
              {error}
            </div>
          )}
        </div>

        {/* Matches */}
        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Matches</h2>

          {matches.length === 0 && (
            <p className="text-gray-400">No matches yet.</p>
          )}

          <div className="space-y-4">
            {matches.map((ev) => (
              <div
                key={ev.id}
                className="bg-gray-900 border border-gray-700 rounded-xl p-4 hover:border-indigo-600 transition cursor-pointer"
                onClick={() => goToBrowseEvent(ev)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{ev.title}</h3>
                    <p className="text-gray-300 text-sm">
                      {new Date(ev.startTime).toLocaleString()} –{" "}
                      {new Date(ev.endTime).toLocaleTimeString()}
                    </p>
                    {ev.location && (
                      <p className="text-gray-400 text-sm">{ev.location}</p>
                    )}
                  </div>
                  <div className="text-sm text-indigo-300">
                    score: <span className="font-semibold">{ev.matchScore}</span>
                  </div>
                </div>

                {ev.matchedSkills?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-400">Matched skills:</span>
                    {ev.matchedSkills.map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-indigo-700/30 border border-indigo-600 px-2 py-0.5 rounded text-indigo-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {ev.description && (
                  <p className="mt-3 text-sm text-gray-300">{ev.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
