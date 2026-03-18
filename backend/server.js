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

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJson(text) {
  if (!text || typeof text !== "string") return null;

  const direct = safeJsonParse(text);
  if (direct) return direct;

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  return safeJsonParse(match[0]);
}

function normaliseActivities(activities) {
  if (!Array.isArray(activities)) return [];

  return activities
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      name:
        typeof item.name === "string" && item.name.trim()
          ? item.name.trim()
          : "Suggested activity",
      address:
        typeof item.address === "string" && item.address.trim()
          ? item.address.trim()
          : "",
    }));
}

async function geocode(address) {
  if (!address || !address.trim()) {
    return { lat: null, lng: null, resolvedAddress: "" };
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    address
  )}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "DateifyApp/1.0" },
  });

  if (!res.ok) {
    return { lat: null, lng: null, resolvedAddress: address };
  }

  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    return { lat: null, lng: null, resolvedAddress: address };
  }

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    resolvedAddress: data[0].display_name || address,
  };
}

async function geocodeWithFallback(address, fallbackArea = "") {
  const firstTry = await geocode(address);
  if (firstTry.lat !== null && firstTry.lng !== null) return firstTry;

  if (fallbackArea && address) {
    const secondTry = await geocode(`${address}, ${fallbackArea}`);
    if (secondTry.lat !== null && secondTry.lng !== null) return secondTry;
  }

  return firstTry;
}

function buildPrompt({
  locationMode,
  location,
  locationPrompt,
  duration,
  budget,
  vibe,
}) {
  const locationInstruction =
    locationMode === "ai-generated"
      ? `The user wants AI to choose a suitable area based on this preference: "${locationPrompt}". First decide a realistic area, then generate the plan there.`
      : `Use this location exactly as the planning area: "${location}".`;

  return `
Create a realistic date plan.

Requirements:
- ${locationInstruction}
- Duration: ${duration || "Not specified"}
- Budget: ${budget || "Not specified"}
- Vibe: ${vibe || "Romantic"}

Rules:
- Suggest real-world style places and activities.
- Keep activities practical and locally consistent.
- Return between 3 and 5 activities.
- Every activity must include:
  - "name"
  - "address"
- If an exact venue is uncertain, provide the best usable address or area description.
- Return strict JSON only with no markdown fences and no extra commentary.

Return this exact JSON shape:
{
  "title": "",
  "summary": "",
  "chosenLocation": "",
  "activities": [
    { "name": "", "address": "" }
  ]
}
`;
}

app.post("/api/plan-date", async (req, res) => {
  try {
    const {
      locationMode = "specific",
      location = "",
      locationPrompt = "",
      duration = "",
      budget = "",
      vibe = "Romantic",
    } = req.body || {};

    if (locationMode === "specific" && !location.trim()) {
      return res.status(400).json({
        error: "Please enter a location.",
      });
    }

    if (locationMode === "ai-generated" && !locationPrompt.trim()) {
      return res.status(400).json({
        error: "Please describe the kind of location you want AI to generate.",
      });
    }

    const prompt = buildPrompt({
      locationMode,
      location,
      locationPrompt,
      duration,
      budget,
      vibe,
    });

    const aiRes = await fetch("https://api.featherless.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You are a date-planning assistant. Return strict valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      console.error("AI API error:", errorText);
      return res.status(502).json({
        error: "The AI service failed to generate a plan.",
      });
    }

    const aiData = await aiRes.json();
    const text = aiData.choices?.[0]?.message?.content || "";
    const parsed = extractJson(text);

    if (!parsed) {
      return res.status(500).json({
        error: "AI returned an invalid response format.",
      });
    }

    const activities = normaliseActivities(parsed.activities);
    if (activities.length === 0) {
      return res.status(200).json({
        title: parsed.title || "Your Date Plan",
        summary:
          parsed.summary ||
          "We could not generate mappable activities this time.",
        chosenLocation:
          parsed.chosenLocation ||
          (locationMode === "specific" ? location : locationPrompt),
        activities: [],
        meta: {
          locationResolved: false,
          partialLocationFailure: false,
          message:
            "AI could not find suitable activities. Try a broader or clearer location.",
        },
      });
    }

    const fallbackArea =
      (typeof parsed.chosenLocation === "string" && parsed.chosenLocation.trim()) ||
      (locationMode === "specific" ? location.trim() : "");

    const resolvedActivities = await Promise.all(
      activities.map(async (activity) => {
        try {
          const coords = await geocodeWithFallback(
            activity.address,
            fallbackArea
          );

          return {
            ...activity,
            address: coords.resolvedAddress || activity.address,
            lat: coords.lat,
            lng: coords.lng,
          };
        } catch (error) {
          return {
            ...activity,
            lat: null,
            lng: null,
          };
        }
      })
    );

    const mappedCount = resolvedActivities.filter(
      (item) => item.lat !== null && item.lng !== null
    ).length;

    const hasValidLocations = mappedCount > 0;
    const partialLocationFailure = mappedCount < resolvedActivities.length;

    return res.json({
      title: parsed.title || "Your Date Plan",
      summary:
        parsed.summary || "A customised AI-generated date plan for your vibe.",
      chosenLocation:
        parsed.chosenLocation ||
        (locationMode === "specific" ? location : "AI-selected area"),
      activities: resolvedActivities,
      meta: {
        locationResolved: hasValidLocations,
        partialLocationFailure,
        mappedCount,
        totalCount: resolvedActivities.length,
        message: hasValidLocations
          ? partialLocationFailure
            ? "Plan generated, but some locations could not be mapped."
            : "Plan generated successfully."
          : "Plan generated, but no activities could be mapped. You can still edit the addresses manually.",
      },
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Failed to generate plan" });
  }
});

app.listen(5555, () => {
  console.log("Backend running on http://localhost:5555");
});