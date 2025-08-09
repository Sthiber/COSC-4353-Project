// server/controllers/matchController.js
import db from "../db.js";
// import { events } from "../data/events.js";  <---- We are going to pull from the actual db
import { volunteers as mockVolunteers } from "../data/volunteers.js";
import { addNotification as addMockNotification } from "./notificationsController.js";

const USE_DB = true;
// String(process.env.USE_DB || "").toLowerCase() === "1" ||
// String(process.env.USE_DB || "").toLowerCase() === "true";

/**
 * GET /api/match/:volunteerId
 * Returns ranked event matches for a volunteer and creates a notification
 * for the top match.
 */
export async function matchVolunteer(req, res) {
  const { volunteerId } = req.params;

  try {
    // 1) Load the volunteer (DB or mock)
    let volunteer;
    if (USE_DB) {
      const [rows] = await db.query(
          `SELECT
             p.user_id,
             p.city,
             p.state,
             p.zip_code,
             GROUP_CONCAT(s.skill_name SEPARATOR ', ') AS skills
           FROM profile p
                  LEFT JOIN profile_skill ps ON p.user_id = ps.user_id
                  LEFT JOIN skill s ON ps.skill_id = s.skill_id
           WHERE p.user_id = ?
           GROUP BY p.user_id, p.city, p.state, p.zip_code`,
          [volunteerId]
      );
      if (!rows.length) {
        return res.status(404).json({ message: "Volunteer not found" });
      }

      // SG: Commented this out because we are pulling data differently from the db.
      //   volunteer = rows[0];
      //   // normalize CSV fields to arrays
      //   volunteer.skills = (volunteer.skills || "")
      //     .split(",")
      //     .map((s) => s.trim())
      //     .filter(Boolean);
      //   volunteer.preferences = (volunteer.preferences || "")
      //     .split(",")
      //     .map((s) => s.trim())
      //     .filter(Boolean);
      //   volunteer.availability = {
      //     start: volunteer.availability_start,
      //     end: volunteer.availability_end,
      //   };
      // } else {
      //   volunteer = mockVolunteers.find(
      //     (v) => String(v.id) === String(volunteerId)
      //   );
      //   if (!volunteer) {
      //     return res.status(404).json({ message: "Volunteer not found" });
      //   }

      const csvSkills = rows[0].skills;
      volunteer = {
        id: rows[0].user_id,
        location: `${rows[0].city}, ${rows[0].state}, ${rows[0].zip_code}`,
        skills: (csvSkills || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        // Availability will be handled later
      };
    }

    // SG: This query retrieves all the events found in the db. This will be used to score later on
    const [events] = await db.query(
        `SELECT
           em.event_id,
           em.event_name,
           em.event_location,
           em.event_description,
           em.start_time,
           em.end_time,
           GROUP_CONCAT(s.skill_name SEPARATOR ', ') AS required_skills
         FROM eventManage em
                LEFT JOIN event_skill es ON em.event_id = es.event_id
                LEFT JOIN skill s ON es.skill_id = s.skill_id
         WHERE em.start_time > NOW()
           AND em.event_id NOT IN (
           SELECT event_id
           FROM volunteer_history
           WHERE volunteer_id = ? AND event_status = 'Upcoming'
         )
         GROUP BY em.event_id, em.event_name, em.event_location,
                  em.event_description, em.start_time, em.end_time
         ORDER BY em.start_time ASC`,
        [volunteerId]
    );
    /* Sample Return of the query above:
    12,Bobos Party,123 Houston St.,Communication,2025-08-07 03:58:05,2025-08-01 03:58:07
    12,Bobos Party,123 Houston St.,Teamwork,2025-08-07 03:58:05,2025-08-01 03:58:07
    12,Bobos Party,123 Houston St.,Event Planning,2025-08-07 03:58:05,2025-08-01 03:58:07
    14,Tech Meetup: AI in 2025,"The Ion, 4201 Main St, Houston, TX",Public Speaking,2025-08-05 19:00:00,2025-08-05 21:30:00
    14,Tech Meetup: AI in 2025,"The Ion, 4201 Main St, Houston, TX",Tech Support,2025-08-05 19:00:00,2025-08-05 21:30:00

    There is a lot of redundant information in this query so we will combine all of the skills into one array
    */

    const eventMap = new Map();

    events.forEach((row) => {
      if (!eventMap.has(row.event_id)) {
        eventMap.set(row.event_id, {
          id: row.event_id,
          title: row.event_name,
          location: row.event_location,
          startTime: row.start_time,
          endTime: row.end_time,
          description: row.event_description,
          requiredSkills: [],
        });
      }

      if (row.required_skills) {
        eventMap.get(row.event_id).requiredSkills = row.required_skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
      }
    });

    const parsedEvents = Array.from(eventMap.values());

    //SG: Now at this point we have a object that holds all the events and the skills are all in one array.

    // // 2) Score events
    // const matchedEvents = events
    //   .map((ev) => {
    //     const locationMatch = ev.location === volunteer.location;

    //     const matchedSkills = ev.requiredSkills.filter((skill) =>
    //       (volunteer.skills || []).includes(skill)
    //     );
    //     const skillScore = matchedSkills.length;

    //     const availabilityMatch =
    //       new Date(volunteer.availability?.start) <= new Date(ev.startTime) &&
    //       new Date(volunteer.availability?.end) >= new Date(ev.endTime);

    //     const preferenceBonus = (volunteer.preferences || []).includes(
    //       ev.preferenceTag
    //     )
    //       ? 1
    //       : 0;

    //     const matchScore =
    //       (locationMatch ? 1 : 0) +
    //       (availabilityMatch ? 1 : 0) +
    //       skillScore +
    //       preferenceBonus;

    //     return { ...ev, matchScore, matchedSkills };
    //   })
    //   .filter((ev) => ev.matchScore > 2) // keep good matches
    //   .sort((a, b) => b.matchScore - a.matchScore);

    const matchedEvents = parsedEvents
        .map((ev) => {
          const locationMatch = ev.location === volunteer.location;

          const matchedSkills = ev.requiredSkills.filter((skill) =>
              (volunteer.skills || []).includes(skill)
          );
          const skillScore = matchedSkills.length;

          // I will add this on later
          // const availabilityMatch =
          //   new Date(ev.endTime) >= new Date(volunteer.availability.start) &&
          //   new Date(ev.startTime) <= new Date(volunteer.availability.end);

          // (availabilityMatch ? 2 : 0) + Add this on later
          const matchScore = (locationMatch ? 2 : 0) + skillScore * 2;

          return { ...ev, matchScore, matchedSkills };
        })
        .filter((ev) => ev.matchScore >= 2)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

    // SG: I commented this stuff out because its mock data and we need to pull from the actual db.

    // 3) If we found a match, create a notification for the top one
    // if (matchedEvents.length > 0) {
    //   const top = matchedEvents[0];
    //   const message = `You've been matched to ${top.title}!`;

    //   if (USE_DB) {
    //     await db.query(
    //       "INSERT INTO notifications (userId, message, is_read) VALUES (?, ?, ?)",
    //       [volunteer.id, message, false]
    //     );
    //   } else {
    //     // mock path uses in-memory notification store
    //     addMockNotification(volunteer.id, message);
    //   }
    // }

    // 4) Return ranked matches

    return res.json(matchedEvents);
  } catch (err) {
    console.error("Error matching volunteer:", err);
    return res.status(500).json({ message: "Server error" });
  }
}