import express from "express";
import db from "../db.js";

const router = express.Router();

// Logging incoming requests:
router.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  next();
});

// Route to save event to MySQL
router.post("/", async (req, res) => {
  console.log("2. Backend: Received Request Body", req.body);
  const {
    event_name,
    event_description,
    event_location,
    skills,
    urgency,
    eventDate,
    created_by,
    start_time,
    end_time,
  } = req.body;

  if (!created_by)
    return res.status(400).json({ message: "created_by id required" });
  const formatTime = (t) => {
    if (!t) return null;
    // If only HH:mm, append seconds and space between date and time
    return t.length === 5 ? `${eventDate} ${t}:00` : `${eventDate} ${t}`;
  };

  try {
    const [eventResult] = await db.query(
      `INSERT INTO eventManage (event_name, event_description, event_location, urgency, eventDate, created_by, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_name || null,
        event_description || null,
        event_location || null,
        // skills || null,
        urgency || null,
        eventDate || null,
        created_by || null,
        formatTime(start_time) || null,
        formatTime(end_time) || null,
      ]
    );

    const event_id = eventResult.insertId;
    // We need to split up skills, everytime there is a comma
    const skillList = Array.isArray(skills)
      ? skills
      : skills.split(",").map((skill) => skill.trim());

    for (const skillName of skillList) {
      const [existingSkillRows] = await db.query(
        `SELECT skill_id FROM skill WHERE skill_name = ?`,
        [skillName]
      );

      let skill_id;

      if (existingSkillRows.length > 0) {
        skill_id = existingSkillRows[0].skill_id;
      } else {
        const [insertSkillResult] = await db.query(
          `INSERT INTO skill (skill_name) VALUES (?)`,
          [skillName]
        );
        skill_id = insertSkillResult.insertId;
      }

      await db.query(
        `INSERT INTO event_skill (event_id, skill_id) VALUES (?, ?)`,
        [event_id, skill_id]
      );
    }

    res.status(200).json({ message: "Event saved" });
  } catch (err) {
    console.error("Event save error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

router.get("/:created_by", async (req, res) => {
  const created_by = req.params.created_by;

  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM eventManage WHERE created_by = ?", [created_by]);
    res.json(rows); // Send rows to frontend
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/eventManage/:event_id", async (req, res) => {
  const eventId = req.params.event_id;

  try {
    // First: Delete from event_skill to avoid FK conflict
    await db.query("DELETE FROM event_skill WHERE event_id = ?", [eventId]);

    // Then: Delete the event itself
    await db.query("DELETE FROM eventManage WHERE event_id = ?", [eventId]);

    res.json({ message: "Event and associated skills deleted successfully" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ error: "Failed to delete event", details: err });
  }
});

router.delete("/skill/:skill_id", async (req, res) => {
  const skillId = req.params.skill_id;

  const sql = "DELETE FROM skill WHERE skill_id = ?";
  db.query(sql, [skillId], (err, result) => {
    if (err) {
      console.error("Error deleting skill:", err);
      res.status(500).json({ error: "Failed to delete skill" });
    } else {
      res.json({ message: "Skill deleted successfully", result });
    }
  });
});

export default router;
