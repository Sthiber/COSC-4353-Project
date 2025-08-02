import express from "express";
import { query } from "../db.js";
export const getNextEvent = async (req, res) => {
  try {
    const volunteerID = req.params.userID;
    const sql =
      "SELECT l.full_name, em.event_id, em.event_name, em.start_time, em.end_time, em.event_location, em.event_description, p.is_complete FROM login AS l LEFT JOIN volunteer_history AS vh ON l.id = vh.volunteer_id LEFT JOIN eventManage AS em ON vh.event_id = em.event_id AND em.start_time > NOW() LEFT JOIN profile AS p ON p.user_id = l.id WHERE l.id = ? ORDER BY em.start_time ASC LIMIT 1;";

    const result = await query(sql, [volunteerID]);
    const next_event = result.length > 0 ? result[0] : null;

    res.status(200).json({ next_event });
  } catch (error) {
    console.error(
      "Error fetching volunteer's history (Backend)",
      error.message
    );
    res
      .status(500)
      .json({ message: "Server error fetching volunteer's next event" });
  }
};
const router = express.Router();

router.use("/:userID", getNextEvent);

export default router;
