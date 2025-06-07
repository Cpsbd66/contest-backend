// api/index.js
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Vercel needs this wrapper
export default function handler(req, res) {
  app(req, res);
}

// Resource IDs for Clist.by v4
const RESOURCE_V4 = {
  codeforces: 1,
  codechef:   2,
  topcoder:   12,
  atcoder:    93,
  leetcode:   102,
};

// Clist API fetch
async function fetchUpcomingV4(resourceId) {
  const resp = await axios.get("https://clist.by:443/api/v4/contest/", {
    params: {
      username:    process.env.CLIST_USERNAME,
      api_key:     process.env.CLIST_API_KEY,
      upcoming:    "true",
      resource_id: resourceId,
      limit:       100,
      order_by:    "start",
      start__gt:   new Date().toISOString(),
    },
  });
  return resp.data.objects || [];
}

function normalize(list) {
  return list.map(c => ({
    name:  c.event,
    url:   c.href,
    start: c.start,
  }));
}

// API route: /api
app.get("/api", async (req, res) => {
  try {
    const promises = Object.values(RESOURCE_V4).map(fetchUpcomingV4);
    const results = await Promise.all(promises);

    const combined = results
      .flat()
      .map(c => ({ name: c.event, url: c.href, start: c.start }))
      .sort((a, b) => new Date(a.start) - new Date(b.start));

    res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contests" });
  }
});
