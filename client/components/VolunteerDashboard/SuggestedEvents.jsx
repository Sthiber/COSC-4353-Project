import { useState } from "react";
import axios from "axios";
import { ChevronRight, ChevronLeft, X, Calendar, Clock, MapPin, Briefcase } from "lucide-react";

export const SuggestedEvents = ({ suggestedEvents, onRefresh, setActiveS }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [page, setPage] = useState(0);
  const API_URL = import.meta.env.VITE_API_URL;

  const itemsPerPage = 3;
  const paginatedEvents = suggestedEvents.slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage);

  const openPopup = (event) => {
    setSelectedEvent(event);
    setShowPopup(true);
  };

  const closePopup = () => {
    setSelectedEvent(null);
    setShowPopup(false);
  };

  const postInterest = async (eventID) => {
    try {
      const volunteerID = localStorage.getItem("userId");
      await axios.post(`${API_URL}/volunteer-dashboard/interest/${eventID}`, { userID: volunteerID });
      await onRefresh();
      closePopup();
    } catch (error) {
      console.error("Error: ", error);
    }
  };

  if (suggestedEvents.length === 0) {
    return (
      <div className="bg-[#222b45] rounded-xl p-6 mb-6 text-center">
        <h2 className="text-xl font-semibold text-white mb-2">No Suggested Events</h2>
        <p className="text-gray-400 mb-4">We couldn't find any event matches for you at this time.</p>
        <button
          onClick={() => setActiveS("all-events")}
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
        >
          View All Available Events
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#222b45] rounded-xl p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Suggested Events</h2>
        <div className="flex items-center space-x-2">
          <button
            className="p-1 rounded-full bg-[#1a2035] hover:bg-indigo-700 disabled:opacity-30"
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="p-1 rounded-full bg-[#1a2035] hover:bg-indigo-700 disabled:opacity-30"
            onClick={() =>
              setPage((prev) =>
                (prev + 1) * itemsPerPage < suggestedEvents.length ? prev + 1 : prev
              )
            }
            disabled={(page + 1) * itemsPerPage >= suggestedEvents.length}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paginatedEvents.map((event) => (
          <div
            key={event.id}
            data-event-title={event.title || ""}
            className="bg-[#1a2035] rounded-lg p-4 min-w-[250px]"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-medium">{event.title}</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              {new Date(event.startTime).toLocaleDateString("en-US")} at{" "}
              {new Date(event.startTime).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
            <button
              onClick={() => openPopup(event)}
              className="w-full bg-transparent hover:bg-indigo-700 text-indigo-400 hover:text-white border border-indigo-500 rounded py-1.5 text-sm transition-colors"
            >
              I'm Interested
            </button>
          </div>
        ))}
      </div>

      {showPopup && selectedEvent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-[#1a2035] text-white rounded-xl p-6 w-[90%] max-w-md relative shadow-lg">
            <button onClick={closePopup} className="absolute top-3 right-3 text-gray-400 hover:text-red-400">
              <X size={20} />
            </button>

            <h3 className="text-2xl font-semibold text-indigo-400 mb-4">{selectedEvent.title}</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center">
                <Calendar className="mr-3 text-indigo-400" size={18} />
                <span>{new Date(selectedEvent.startTime).toLocaleDateString("en-US")}</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-3 text-indigo-400" size={18} />
                <span>
                  {new Date(selectedEvent.startTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}{" "}
                  -{" "}
                  {new Date(selectedEvent.endTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-3 text-indigo-400" size={18} />
                <span>{selectedEvent.location || "TBD"}</span>
              </div>
              <div className="flex items-center">
                <Briefcase className="mr-3 text-indigo-400" size={18} />
                <span>{selectedEvent.category || "General"}</span>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-300">{selectedEvent.description}</div>

            <button
              onClick={() => {
                postInterest(selectedEvent.id);
              }}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg"
            >
              Confirm Interest
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
