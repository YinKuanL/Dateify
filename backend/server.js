import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.FEATHERLESS_API_KEY;
const MODEL = "Qwen/Qwen2.5-7B-Instruct";

async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "DateifyApp/1.0" },
  });

  const data = await res.json();

  if (!data.length) return { lat: null, lng: null };

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
  };
}

app.post("/api/plan-date", async (req, res) => {
  try {
    const { location, duration, budget, vibe } = req.body;

    const prompt = `
Create a date plan in ${location}.
- Duration: ${duration}
- Budget: ${budget}
- Vibe: ${vibe}

Return JSON only:
{
  "title": "",
  "summary": "",
  "activities": [
    { "name": "", "address": "" }
  ]
}
`;

    const aiRes = await fetch("https://api.featherless.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "Return strict JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const aiData = await aiRes.json();
    const text = aiData.choices?.[0]?.message?.content;

    const parsed = JSON.parse(text);

    // 🔥 add coordinates
    const activities = await Promise.all(
      parsed.activities.map(async (a) => {
        const coords = await geocode(a.address);
        return { ...a, ...coords };
      })
    );

    res.json({
      title: parsed.title,
      summary: parsed.summary,
      activities,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate plan" });
  }
});

app.listen(5555, () => {
  console.log("Backend running on http://localhost:5555");
});