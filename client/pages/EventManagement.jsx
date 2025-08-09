// Israel Trejo - EventManagement Page
// - Sends event details to backend to be sent to the database
// - Code is consistent with CompleteProfile.jsx file

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import EventHeader from "../components/EventManagement/EventHeader";
import Navbar from "../components/Navbar";
import Description from "../components/EventManagement/Description";
import EventInfo from "../components/EventManagement/EventInfo";
import Location from "../components/EventManagement/Location";
import SkillsSection from "../components/CompleteProfile/Skills";
import Urgency from "../components/EventManagement/Urgency";
import EventDate from "../components/EventManagement/EventDate"
import EventTime from "../components/EventManagement/EventTime";
import { Button } from "../components/ui/Button";

// Test to see if I can see changes in console:
console.log("Hello")

// Main Function:
export default function EventManagement(){
  const navigate = useNavigate();
  const API_URL = "http://localhost:3000";

  const [manageData, setManageData] = useState({
    // Event Features:
    event_name: "",
    event_description: "",
    event_location: "",
    skills: [],
    urgency: "",
    eventDate: [],
    start_time: "",
    end_time: ""
  });

  // --- Local UI State ---
  const [errors, setErrors] = useState({});
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Start & End Time:
  const [selectedStart, setSelectedStart] = useState("");
  const [selectedEnd, setSelectedEnd] = useState("");


  // Hard-coded skill options for now. Replace with API later if needed.
  const skillOptions = [
    "Communication",
    "Teamwork",
    "First Aid",
    "Event Planning",
    "Childcare",
    "Food Preparation",
    "Elderly Assistance",
    "Tutoring",
    "Fundraising",
    "Public Speaking",
    "Cleaning",
    "Mentoring",
    "Translation",
    "Tech Support",
    "Environmental Cleanup",
  ];

  // Verifies that all event features are filled out:
  useEffect(() => {
    const changed =
      manageData.event_name ||
      manageData.event_description ||
      manageData.event_location ||
      manageData.skills.length > 0 ||
      manageData.urgency ||
      manageData.eventDate.length > 0;
    setHasUnsavedChanges(changed);
  }, [manageData]);

  // Warn on page unload if unsaved changes
  useEffect(() => {
      const handleBeforeUnload = (e) => {
        if (hasUnsavedChanges) {
          e.preventDefault();
          e.returnValue = ""; // Required to show browser prompt
        }
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
  }, [hasUnsavedChanges]);

  // Loading Event Details:
  useEffect(() => {
    const created_by = localStorage.getItem("created_by");
    if (!created_by) return;

    fetch(`${API_URL}/events/${created_by}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;

          setManageData((prev) => ({
            ...prev,
            // prefer new backend alias -> fallback legacy fields -> keep existing
            event_name: data.event_name ?? "",
            event_description: data.event_description ?? "",
            event_location: data.event_location ?? "",
            skills: data.skills ? data.skills.split(/,\s*/) : [],
            urgency: data.urgency ?? "",
            eventDate: data.eventDate ? data.eventDate.split(/,\s*/): [],
          }));
      })
      .catch(() => {
        /* ignore load errors silently */
      });
  }, [API_URL]);

  // --- Change Handlers ---
  const handleInputChange = (field, value) => {
    const normalizedValue = field === "state" ? value.toUpperCase() : value;
    setManageData((prev) => ({
      ...prev,
      [field]: normalizedValue,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSkillToggle = (skill) => {
    setManageData((prev) => ({
    ...prev,
      skills: prev.skills.includes(skill)
          ? prev.skills.filter((s) => s !== skill)
          : [...prev.skills, skill],
    }));
  };

  const handleDateAdd = () => {
    if (selectedDate && !manageData.eventDate.includes(selectedDate)) {
    setManageData((prev) => ({
        ...prev,
        eventDate: [...prev.eventDate, selectedDate],
    }));
    setSelectedDate("");
    }
  };

  const handleDateRemove = (dateToRemove) => {
    setManageData((prev) => ({
      ...prev,
      eventDate: prev.eventDate.filter((d) => d !== dateToRemove),
    }));
  };

  const onStartChange = (value) => {
    setManageData(prev => ({ ...prev, start_time: value }));
  };

  const onEndChange = (value) => {
    setManageData(prev => ({ ...prev, end_time: value }));
  };
    
  // --- Validation ---
  const validateForm = () => {
      const newErrors = {};

      if (!manageData.event_name.trim()){
          newErrors.event_name = "Event Name is required";
      } else if (manageData.event_name.length > 100){
          newErrors.event_name = "Event Name must be 100 characters or less";
      }

      if (!manageData.event_description.trim()){
          newErrors.event_description = "Event Description is required";
      }
      
      if (!manageData.event_location.trim()){
          newErrors.event_location = "Location is required";
      }

      if (manageData.skills.length === 0){
          newErrors.skills = "Please select at least one skill";
      }

      if (!manageData.urgency){
          newErrors.urgency = "Urgency is required";
      }
      
      if (manageData.eventDate.length === 0){
          newErrors.eventDate = "Please select at least one available date";
      }

      if (manageData.start_time.length === 0 || manageData.end_time.length === 0) {
          newErrors.event_time = "Please select both a start and end time";
      }
      
      console.log("Validation Errors:", newErrors);
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  // --- Backend Handling ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const created_by = localStorage.getItem("userId"); // pull from storage
    if (!created_by) {
      toast.error("Please log in first");
      return;
    }

    const payload = {
      created_by,
      event_name: manageData.event_name,
      event_description: manageData.event_description,
      event_location: manageData.event_location,
      skills: manageData.skills.join(","), // convert array to string
      urgency: manageData.urgency,
      eventDate: manageData.eventDate.join(","), // convert array to string
      start_time: manageData.start_time,
      end_time: manageData.end_time
    };
    console.log("1. Frontend: Sending Payload", payload);

    try {
      const res = await fetch(`${API_URL}/event-management/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        console.error(data.message || "Event save failed");
        toast.error(data.message || "Event save failed");
        return;
      }

      // Saving Event flag & name locally
      localStorage.setItem("eventComplete", "true");
      alert("Event Saved!");
      setHasUnsavedChanges(false);
      navigate("/");
    } catch (err) {
      console.error("Error submitting event:", err);
      toast.error("Network Error: cound not save event");
    }
  };

  // --- Render ---
  return (
    <>
      <div className="min-h-screen bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <Navbar />
        <EventHeader />
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-700 p-8 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Form Container */}
              <EventInfo
                event_name={manageData.event_name}
                error={errors.event_name}
                onChange={(value) => handleInputChange("event_name", value)}
              />

              <Description
                manageData={manageData}
                onChange={(value) => handleInputChange("event_description", value)}
                error={errors.event_description}
              />

              <Location
                manageData={manageData}
                onChange={(value) => handleInputChange("event_location", value)}
                error={errors.event_location}
              />

              <SkillsSection
                  skills={manageData.skills}
                  error={errors.skills}
                  onToggle={handleSkillToggle}
                  isOpen={isSkillsOpen}
                  setIsOpen={setIsSkillsOpen}
                  skillOptions={skillOptions}
              />

              <Urgency
                urgency={manageData.urgency}
                onChange={(e) => setManageData((prevData) => ({ ...prevData, urgency: e.target.value }))}
                error={errors.urgency}
              />

              <EventDate
                eventDate={manageData.eventDate}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onAddDate={handleDateAdd}
                onRemoveDate={handleDateRemove}
                error={errors.eventDate}
              />

              <EventTime
                selectedStartTime={manageData.start_time}
                selectedEndTime={manageData.end_time}
                onStartTimeChange={onStartChange}
                onEndTimeChange={onEndChange}
                error={errors.event_time}
              />

              <div className="pt-6">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 cursor-pointer hover:bg-gradient-to-r hover:from-blue-800 hover:to-purple-800 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Create Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}