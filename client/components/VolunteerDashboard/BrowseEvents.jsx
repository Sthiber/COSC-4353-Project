import { useState, useEffect } from "react";
import { Search, Filter, Calendar, MapPin } from "lucide-react";
import { EventCard } from "./EventCard";
import { EventDetailView } from "./EventDetailView";
import { toast } from "react-toastify";

export function BrowseEvents({ allEvents: initialAllEvents, onEnroll }) {
  const [allEvents, setAllEvents] = useState(initialAllEvents);
  const [filteredEvents, setFilteredEvents] = useState(initialAllEvents);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [enrolling, setEnrolling] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationTerm, setLocationTerm] = useState("");
  const [selectedUrgency, setSelectedUrgency] = useState("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState("any");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 9;

  // keep in sync with parent
  useEffect(() => {
    setAllEvents(initialAllEvents);
  }, [initialAllEvents]);

  // 🔥 auto-open detail for a specific event id (set by /volunteer page)
  useEffect(() => {
    const target = localStorage.getItem("vd_open_detail_event");
    if (!target || !allEvents?.length) return;

    const hit = allEvents.find((e) => String(e.event_id) === String(target));
    if (hit) {
      setSelectedEvent(hit);
      setShowDetail(true);
      setTimeout(() => {
        const el = document.getElementById(`event-card-${hit.event_id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
    }
    localStorage.removeItem("vd_open_detail_event");
  }, [allEvents]);

  const handleEnroll = async (eventId) => {
    try {
      setEnrolling(eventId);
      const userID = localStorage.getItem("userId");
      await onEnroll?.(userID, eventId);

      // optimistic update
      setAllEvents((prev) =>
        prev.map((e) =>
          e.event_id === eventId ? { ...e, event_status: "Upcoming" } : e
        )
      );
      setFilteredEvents((prev) =>
        prev.map((e) =>
          e.event_id === eventId ? { ...e, event_status: "Upcoming" } : e
        )
      );

      setShowDetail(false);
    } catch (e) {
      console.error("Enroll failed:", e);
      toast.error("Could not enroll. Try again.");
    } finally {
      setEnrolling(null);
    }
  };

  const filterEvents = () => {
    let filtered = allEvents || [];

    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter((event) => {
        const name = event.event_name?.toLowerCase() || "";
        const skills = (event.skills || []).join(", ").toLowerCase();
        const loc = event.event_location?.toLowerCase() || "";
        return name.includes(t) || skills.includes(t) || loc.includes(t);
      });
    }

    if (locationTerm) {
      const l = locationTerm.toLowerCase();
      filtered = filtered.filter((event) =>
        (event.event_location || "").toLowerCase().includes(l)
      );
    }

    if (selectedUrgency !== "all") {
      filtered = filtered.filter(
        (event) => (event.urgency || "").toLowerCase() === selectedUrgency
      );
    }

    const now = new Date();
    switch (selectedDateFilter) {
      case "upcoming":
        filtered = filtered.filter((event) => new Date(event.start_time) > now);
        break;
      case "today":
        filtered = filtered.filter((event) => {
          const d = new Date(event.start_time);
          return d.toDateString() === now.toDateString();
        });
        break;
      case "this_week":
        const start = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - now.getDay()
        );
        const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
        filtered = filtered.filter((event) => {
          const d = new Date(event.start_time);
          return d >= start && d < end;
        });
        break;
      default:
        break;
    }

    setFilteredEvents(filtered);
  };

  useEffect(() => {
    filterEvents();
    setPage(1);
  }, [searchTerm, locationTerm, selectedUrgency, selectedDateFilter, allEvents]);

  const urgencies = [
    ...new Set((allEvents || []).map((e) => e.urgency).filter(Boolean)),
  ];

  const handleCardClick = (event) => {
    setSelectedEvent(event);
    setShowDetail(true);
  };

  const handleBackToBrowse = () => {
    setSelectedEvent(null);
    setShowDetail(false);
  };

  const totalPages = Math.max(1, Math.ceil((filteredEvents?.length || 0) / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = (filteredEvents || []).slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = filteredEvents.length ? startIndex + 1 : 0;
  const showingTo = Math.min(startIndex + PAGE_SIZE, filteredEvents.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <div className="space-y-6">
      {!showDetail && (
        <>
          {/* Search / Filters */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full relative">
                <label htmlFor="search-events" className="sr-only">
                  Find Events (Name, Skill)
                </label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  id="search-events"
                  placeholder="Event name, skill"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <div className="md:w-px h-10 bg-gray-700 hidden md:block" />
              <div className="flex-1 w-full relative">
                <label htmlFor="search-location" className="sr-only">
                  Location
                </label>
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  id="search-location"
                  placeholder="Location"
                  value={locationTerm}
                  onChange={(e) => setLocationTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
              <button
                onClick={filterEvents}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              >
                <Search size={20} />
                <span className="sr-only">Search</span>
              </button>
            </div>
          </div>

          {/* Header + Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Browse All Events</h2>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-lg font-medium">
                Showing {showingFrom} to {showingTo} of {filteredEvents.length} Events
              </span>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <select
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 appearance-none cursor-pointer"
                  aria-label="Filter by Urgency"
                >
                  <option value="all">All Urgency</option>
                  {urgencies.map((u) => (
                    <option key={u} value={String(u).toLowerCase()}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <select
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 appearance-none cursor-pointer"
                  aria-label="Filter by Date"
                >
                  <option value="any">Any Date</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map((event) => (
              <div id={`event-card-${event.event_id}`} key={event.event_id}>
                <EventCard event={event} onClick={handleCardClick} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredEvents.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white disabled:opacity-50"
              >
                Prev
              </button>

              <span className="text-gray-300">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Events Found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </>
      )}

      {showDetail && selectedEvent && (
        <EventDetailView
          event={selectedEvent}
          onBack={handleBackToBrowse}
          onEnroll={handleEnroll}
          enrolling={enrolling}
        />
      )}
    </div>
  );
}
