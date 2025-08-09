import { useEffect, useState, useCallback } from "react";
import axios from "axios";

import Layout from "../components/Layout";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CalendarView from "../components/AdminDashboard/AdminCalendar.jsx";
import EventReportModal from "../components/AdminDashboard/EventReportModal.jsx";
import VolunteerActivityReportModal from "../components/AdminDashboard/VolunteerActivityReportModal.jsx";

const API_URL = "https://cosc-4353-backend.vercel.app";

/* Small helper */
const ymdLocal = (d = new Date()) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/* Clock / server-time widget */
function ClockBar() {
    const [localNow, setLocalNow] = useState(new Date());
    const [serverNow, setServerNow] = useState(null);
    const [driftMs, setDriftMs] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const id = setInterval(() => setLocalNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const fetchServerTime = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/time`, { headers: { "Cache-Control": "no-cache" }});
            const iso = res?.data?.serverIso;
            if (iso) {
                const srv = new Date(iso);     // ISO is UTC
                setServerNow(srv);
                setDriftMs(Date.now() - srv.getTime());
            }
        } catch {
            // leave as is; shows "—"
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchServerTime(); }, [fetchServerTime]);

    const sameDay =
        serverNow ? ymdLocal(serverNow) === ymdLocal(localNow) : null;

    const fmt = (d) => (d ? d.toLocaleString() : "—");
    const fmtDrift = (ms) => {
        if (ms == null) return "—";
        const sign = ms >= 0 ? "+" : "−";
        const secs = Math.round(Math.abs(ms) / 1000);
        return `${sign}${secs}s`;
    };

    return (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
      <span className="px-3 py-1 rounded bg-[#222b45]">
        Local: {fmt(localNow)}
      </span>
            <span className="px-3 py-1 rounded bg-[#222b45]">
        Server: {fmt(serverNow)}
      </span>
            <span className="px-3 py-1 rounded bg-[#222b45]">
        Drift: {fmtDrift(driftMs)}
      </span>
            <span
                className={`px-3 py-1 rounded ${sameDay ? "bg-emerald-700" : "bg-amber-700"}`}
                title="Compares local date vs. server date"
            >
        {sameDay ? "Same day ✓" : "Different day ⚠️"}
      </span>
            <button
                onClick={fetchServerTime}
                disabled={loading}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-60"
            >
                {loading ? "Syncing..." : "Sync now"}
            </button>
        </div>
    );
}

export default function AdminPage() {
    const [allEvents, setAllEvents] = useState([]);
    const [reportOpen, setReportOpen] = useState(false);       // Events/Requests report
    const [activityOpen, setActivityOpen] = useState(false);   // Volunteer Activity report
    const currentUserId = Number(localStorage.getItem("userId") || 0);

    const fetchEvents = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_URL}/events`);
            if (!Array.isArray(data?.events)) throw new Error("Bad /events payload");

            const events = data.events.map((e) => ({
                date: new Date(e.start_time),
                title: e.event_name,
                details: e,
            }));
            setAllEvents(events);
        } catch (err) {
            console.error("fetchEvents:", err.message);
            setAllEvents([]);
        }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    return (
        <Layout>
            <Navbar />

            <div className="pt-24 px-4">
                <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
                <ClockBar />

                <div className="mb-6 flex gap-3">
                    <button
                        onClick={() => setReportOpen(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white"
                    >
                        Event Requests Report
                    </button>

                    <button
                        onClick={() => setActivityOpen(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white"
                    >
                        Volunteer Activity Report
                    </button>
                </div>

                <CalendarView
                    allEvents={allEvents}
                    currentUserId={currentUserId}
                    refreshEvents={fetchEvents}
                />
            </div>

            <Footer />

            {/* Events/Requests modal */}
            <EventReportModal open={reportOpen} onClose={() => setReportOpen(false)} />

            {/* Volunteer Activity modal */}
            <VolunteerActivityReportModal open={activityOpen} onClose={() => setActivityOpen(false)} />
        </Layout>
    );
}
