import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { CalendarView } from "../components/VolunteerDashboard/Calendar";
import { NextEventCard } from "../components/VolunteerDashboard/NextEventCard";
import { NotificationsPanel } from "../components/VolunteerDashboard/NotificationPanel";
import { SuggestedEvents } from "../components/VolunteerDashboard/SuggestedEvents";
import { WelcomeBanner } from "../components/VolunteerDashboard/WelcomeBanner";
import axios from "axios";

export default function VolunteerDashboard() {
  const suggestedEvents = [
    {
      eventID: 1,
      eventName: "Park Cleanup",
      percentMatch: 95,
      date: "Dec 23, 2024",
      time: "4:30 PM",
    },
  ];

  const notifications = [
    {
      id: 1,
      type: "invite",
      eventName: "New Assignment Invitation",
      message: "You've been invited to volunteer at the Community Food Drive.",
      time: "2 hours ago",
      actionRequired: true,
    },
  ];

  const upcomingEvents = [
    {
      date: new Date(2025, 7, 15),
      title: "Community Food Drive",
    },
  ];

  const allEvents = [
    {
      date: new Date(2025, 7, 15),
      title: "Community Food Drive",
    },
    {
      date: new Date(2024, 11, 22),
      title: "Senior Care Visit",
    },
  ];

  const API_URL = import.meta.env.VITE_API_URL;

  const [nextEvent, setNextEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const getNextEvent = async () => {
    try {
      const userID = localStorage.getItem("userId");
      const response = await axios.get(
        `${API_URL}/volunteer-dashboard/${userID}`
      );
      setNextEvent(response.data.next_event); // could be null
    } catch (error) {
      console.error("Error fetching next event:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getNextEvent();
  }, []);

  return (
    <div className="min-h-screen bg-gray-800 py-12 px-4 sm:px-6 lg:px-8 text-white">
      <Navbar />

      {!loading && nextEvent ? (
        <div className="container mx-auto px-4 py-6">
          <WelcomeBanner name={nextEvent?.full_name || "Volunteer"} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <div className="lg:col-span-2">
              <NextEventCard
                eventName={nextEvent?.event_name || "TBD"}
                date={nextEvent?.start_time || "TBD"}
                time={nextEvent?.end_time || "TBD"}
                location={nextEvent?.event_location || "Unknown"}
                category={nextEvent?.category || "General"}
                eventInfo={
                  nextEvent?.event_description || "No details available."
                }
                event={nextEvent?.event_id}
              />
              <SuggestedEvents suggestedEvents={suggestedEvents} />
              <CalendarView
                upcomingEvents={upcomingEvents}
                allEvents={allEvents}
              />
            </div>
            <NotificationsPanel notifications={notifications} />
          </div>
        </div>
      ) : !loading ? (
        <div className="text-center text-xl mt-10">
          No upcoming events found.
        </div>
      ) : null}
    </div>
  );
}
