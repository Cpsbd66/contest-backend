// server.js
import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Your v4 resource IDs
const RESOURCE_V4 = {
  codeforces: 1,
  codechef:   2,
  topcoder:   12,
  atcoder:    93,
  leetcode:   102,
};

/**
 * @param {number} resourceId  v4 resource_id
 * @returns {Promise<Array<{ event:string, href:string, start:string }>>}
 */

async function fetchUpcomingV4(resourceId) {
  const base = "https://clist.by:443/api/v4/contest/";
  const params = {
    username:    process.env.CLIST_USERNAME,
    api_key:     process.env.CLIST_API_KEY,
    upcoming:    "true",
    resource_id: resourceId,
    limit:       100,
    order_by:    "start",
    start__gt:   new Date().toISOString(),
  };

  const resp = await axios.get(base, { params });
  return resp.data.objects || [];
}


function normalize(list) {
  return list.map(c => ({
    name:  c.event,
    url:   c.href,
    start: c.start,
  }));
}

// ————— Combined endpoint —————
app.get("/api", async (req, res) => {
  try {
    const promises = Object.values(RESOURCE_V4).map(id => fetchUpcomingV4(id));
    const results = await Promise.all(promises);

    const combined = results
      .flat()
      .map(c => ({ name: c.event, url: c.href, start: c.start }))
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    res.json(combined);
  } catch (err) {
    console.error("Combined API Error:", err.response?.status, err.response?.data);
    res.status(500).json({ error: "Failed to fetch combined contests" });
  }
});

// Health‐check
app.get("/", (req, res) => {
  res.send("Clist.by v4 combined-backend is up");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
