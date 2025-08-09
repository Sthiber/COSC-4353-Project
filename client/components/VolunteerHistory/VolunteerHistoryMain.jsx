import { useState } from "react";
import { Search, User } from "lucide-react";
import TableCardDV from "./TableCardDV";
import TableCardMV from "./TableCardMV";

export default function VolunteerHistoryMain({ events }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filteredHistory = events
    .filter((event) => {
      const matchesSearch =
        event.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.event_location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (event.event_status &&
          event.event_status.toLowerCase() === statusFilter.toLowerCase());
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.start_time) - new Date(a.start_time);
      }
      return a.event_name.localeCompare(b.event_name);
    });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Filters and Search, Stats div */}
        <div className="p-6 sm:p-8 border-b border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Filter Buttons */}

            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">All Status</option>
                <option value="attended">Attended</option>
                <option value="missed">Missed</option>
                <option value="upcoming">Upcoming</option>
                <option value="withdrew">Withdrew</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* Stats sections (# of events attended, etc.) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {events.filter((e) => e.event_status === "Attended").length}
              </div>
              <div className="text-sm text-gray-300">Events Attended</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">
                {events.filter((e) => e.event_status === "Upcoming").length}
              </div>
              <div className="text-sm text-gray-300">Upcoming Events</div>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                {events.length}
              </div>
              <div className="text-sm text-gray-300">Total Events</div>
            </div>
          </div>
          <TableCardMV filteredHistory={filteredHistory} />
          <div className="hidden lg:block overflow-x-auto py-8">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Event Details
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Location & Skills
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Date & Urgency
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredHistory.map((event) => (
                  <TableCardDV key={event.history_id} event={event} />
                ))}
              </tbody>
            </table>
          </div>
          {filteredHistory.length === 0 && (
            <div className="p-12 text-center">
              <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No volunteer history found
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Start volunteering to see your history here!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
