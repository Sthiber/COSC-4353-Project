import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { CalendarView } from "../components/VolunteerDashboard/Calendar";
import { NextEventCard } from "../components/VolunteerDashboard/NextEventCard";
import NotificationsPanel from "../components/VolunteerDashboard/NotificationPanel";
import { SuggestedEvents } from "../components/VolunteerDashboard/SuggestedEvents";
import { WelcomeBanner } from "../components/VolunteerDashboard/WelcomeBanner";
import { LoadingSpinner } from "../components/LoadingSpinner";
import axios from "axios";
import { DashboardNavigation } from "../components/VolunteerDashboard/DashboardNavigation";
import { MyEvents } from "../components/VolunteerDashboard/MyEvents";
import { VolunteerHistory } from "../components/VolunteerDashboard/History";
import { BrowseEvents } from "../components/VolunteerDashboard/BrowseEvents";

// Small error boundary to avoid blank screen if History or any child throws
import React from "react";
class SafeBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errMsg: "" };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, errMsg: err?.message || "Something went wrong" };
  }
  componentDidCatch(err, info) {
    // don’t spam: just log once in console
    // eslint-disable-next-line no-console
    console.error("VolunteerDashboard child error:", err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#1a2035] border border-gray-700 rounded-lg p-6 text-red-300">
          <div className="font-semibold text-white mb-1">Oops — something broke.</div>
          <div className="text-sm">Details: {this.state.errMsg}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ──────────────────────────────────────────────────────────────
   BASE URLs
────────────────────────────────────────────────────────────── */
const HARD_API = "https://cosc-4353-backend.vercel.app"; // keep as team fallback
const API_URL = import.meta.env.VITE_API_URL || HARD_API;

export default function VolunteerDashboard() {
  /* ───────── local state ───────── */
  const [loading, setLoading] = useState(true);
  const [nextEvent, setNextEvent] = useState({});
  const [suggestedEvents, setSuggested] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [calendarInfo, setCalendarInfo] = useState([]);
  const [activeSection, setActiveSection] = useState("overview");

  const [enrolledEvents, setEnrolledEvents] = useState([]);
  const [browseEvents, setBrowseEvents] = useState([]);

  // for redirect from Volunteer Matching → Browse (auto-open event)
  const [preselectEventId, setPreselectEventId] = useState(null);

  const userID = localStorage.getItem("userId");

  /* ───────── data fetchers ───────── */
  const fetchCalendarEvents = async (uid) => {
    const { data } = await axios.get(`${API_URL}/volunteer-dashboard/calendar/${uid}`);
    setCalendarInfo(data?.calendarData || []);
  };

  const fetchNextEvent = async (uid) => {
    const { data } = await axios.get(`${API_URL}/volunteer-dashboard/${uid}`);
    setNextEvent(data.nextEvent?.[0] ?? null);
  };

  const fetchSuggestedEvents = async (uid) => {
    const { data } = await axios.get(`${API_URL}/api/match/${uid}`);
    setSuggested(Array.isArray(data) ? data : []);
  };

  // combine general + volunteer-request notifications
  const fetchCombinedNotifications = async (uid) => {
    const [{ data: gen }, { data: vr }] = await Promise.all([
      axios.get(`${HARD_API}/notifications/${uid}`),   // stays on HARD_API
      axios.get(`${HARD_API}/vr-notifications/${uid}`) // stays on HARD_API
    ]);

    const generic = (gen.notifications || []).map((n) => ({ ...n, type: "general" }));
    const requests = (vr || []).map((n) => ({ ...n, type: "request" }));

    setNotifications(
      [...generic, ...requests].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )
    );
  };

  const fetchEnrolledEvents = async (uid) => {
    const { data } = await axios.get(`${API_URL}/volunteer-dashboard/enrolled-events/${uid}`);
    setEnrolledEvents(data?.events || []);
  };

  const fetchBrowseEvents = async (uid) => {
    const { data } = await axios.get(`${API_URL}/volunteer-dashboard/browse-events/${uid}`);
    setBrowseEvents(data?.events || []);
  };

  const onBrowseEnroll = async (uid, eventID) => {
    await axios.post(`${API_URL}/volunteer-dashboard/browse-enroll/${uid}/${eventID}`);
    await Promise.all([
      fetchEnrolledEvents(uid),
      fetchBrowseEvents(uid),
      fetchSuggestedEvents(uid),
      fetchCalendarEvents(uid),
    ]);
  };

  /* ───────── initial load ───────── */
  const loadData = async () => {
    if (!userID) return;
    try {
      setLoading(true);
      await Promise.all([
        fetchCalendarEvents(userID),
        fetchNextEvent(userID),
        fetchSuggestedEvents(userID),
        fetchCombinedNotifications(userID),
        fetchEnrolledEvents(userID),
        fetchBrowseEvents(userID),
      ]);
    } catch (err) {
      console.error("Dashboard load error:", err?.message || err);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  useEffect(() => {
    if (userID) loadData();
  }, []);

  // ONE-TIME read for redirect from Volunteer Matching (then clear it)
  useEffect(() => {
    const selected = sessionStorage.getItem("selectedEventId");
    if (selected) {
      setActiveSection("all-events");
      setPreselectEventId(selected);
      sessionStorage.removeItem("selectedEventId");
    }
  }, []);

  /* ───────── render ───────── */
  return (
    <div className="min-h-screen bg-gray-800 py-12 px-4 sm:px-6 lg:px-8 text-white">
      <Navbar />

      {loading ? (
        <LoadingSpinner fullScreen text="Loading your dashboard" />
      ) : nextEvent?.is_complete === 1 ? (
        <div className="container mx-auto px-4 py-6">
          <WelcomeBanner name={nextEvent.full_name} />

          <div className="mt-6">
            <DashboardNavigation
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>

          {/* main column */}
          {activeSection === "overview" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                <div className="lg:col-span-2">
                  <NextEventCard
                    eventName={nextEvent.event_name}
                    date={nextEvent.start_time}
                    time={nextEvent.end_time}
                    location={nextEvent.event_location}
                    category={nextEvent.event_category}
                    eventInfo={nextEvent.event_description}
                    event={nextEvent.event_id}
                    requiredSkills={nextEvent.required_skills}
                  />

                  <SuggestedEvents
                    suggestedEvents={suggestedEvents}
                    onRefresh={loadData}
                    setActiveS={setActiveSection}
                  />

                  <CalendarView calendarInfo={calendarInfo} />
                </div>

                <NotificationsPanel
                  notifications={notifications}
                  refresh={async () => {
                    await Promise.all([
                      fetchCombinedNotifications(userID), // notifications
                      fetchEnrolledEvents(userID),        // My Events
                      fetchCalendarEvents(userID),        // calendar
                      fetchBrowseEvents(userID),          // keep list fresh
                    ]);
                  }}
                />
              </div>
            </>
          )}

          {activeSection === "my-events" && (
            <div className="grid grid-cols-1 lg:grid-cols-1">
              <MyEvents enrolledEvents={enrolledEvents} onRefresh={loadData} />
            </div>
          )}

          {activeSection === "all-events" && (
            <BrowseEvents
              allEvents={browseEvents}
              onEnroll={onBrowseEnroll}
              preselectEventId={preselectEventId} // <<< auto-open target event
            />
          )}

          {activeSection === "history" && (
            <SafeBoundary>
              <VolunteerHistory />
            </SafeBoundary>
          )}
        </div>
      ) : (
        /* profile-incomplete overlay */
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-[#1a2035] text-white rounded-xl p-8 max-w-md w-full mx-4 shadow-lg border border-gray-700/50">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-6">
                {/* Icon intentionally removed to reduce import noise */}
                <span className="font-bold text-indigo-400 text-xl">!</span>
              </div>

              <h2 className="text-2xl font-semibold mb-3">
                Complete Your Profile
              </h2>

              <p className="text-gray-300 mb-8 leading-relaxed">
                Please finish setting up your profile to access all dashboard
                features and get the most out of your experience.
              </p>

              <button
                onClick={() => (window.location.href = "/complete-profile")}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
              >
                Complete Profile Now
              </button>

              <p className="text-xs text-gray-400 mt-4">
                This will only take a few minutes
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
