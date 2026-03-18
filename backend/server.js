import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.FEATHERLESS_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
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

function looksTooVague(address) {
  if (!address || typeof address !== "string") return true;

  const vaguePatterns = [
    "city centre",
    "downtown",
    "near the river",
    "old town",
    "town centre",
    "beach area",
    "shopping district",
    "local cafe",
    "restaurant area",
    "somewhere in",
    "nearby",
    "central area",
    "a nice place in",
  ];

  const lower = address.toLowerCase().trim();
  if (lower.length < 8) return true;

  return vaguePatterns.some((pattern) => lower.includes(pattern));
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

// --- Romantic Scoring Integration ---

async function fetchPlaceData(name, locationHint) {
  if (!GOOGLE_MAPS_API_KEY) return null;

  try {
    const searchUrl = "https://places.googleapis.com/v1/places:searchText";
    const res = await fetch(searchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.id,places.rating,places.userRatingCount,places.priceLevel,places.types,places.editorialSummary,places.reviews",
      },
      body: JSON.stringify({
        textQuery: `${name}${locationHint ? ` in ${locationHint}` : ""}`,
        maxResultCount: 1,
      }),
    });

    if (!res.ok) {
      console.error("Google Places API error:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.places?.[0] || null;
  } catch (err) {
    console.error("Error fetching place data:", err);
    return null;
  }
}

async function callLLM(prompt) {
  if (!API_KEY) return null;

  try {
    const res = await fetch("https://api.featherless.ai/v1/chat/completions", {
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
            content: "You are a romantic atmosphere expert. Rate places for dates.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      console.error("Featherless AI API error:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error("Error calling LLM:", err);
    return null;
  }
}

async function enrichWithRomanticScore(activity, fallbackArea = "") {
  // 1. Fetch place data from Google
  const placeData = await fetchPlaceData(activity.name, fallbackArea);

  const summary = placeData?.editorialSummary?.text || "";
  const reviews = placeData?.reviews?.map(r => r.text?.text).join(" ").slice(0, 1000) || "";
  const types = placeData?.types?.join(", ") || "";
  const rating = placeData?.rating || 4.0;
  const name = placeData?.displayName?.text || activity.name;

  // Option A – Rule-based fallback
  let score = rating * 1.5; // base 4–5 → 6–7.5
  if (/cozy|romantic|intimate|candle|view|river|sunset|garden|botanic|fine dining|elegant/i.test(summary + name + types + reviews)) {
    score += 2.5;
  }
  if (placeData?.photos?.length > 3) score += 1;
  score = Math.min(10, Math.max(3, Math.round(score * 10) / 10));

  let reason = summary.includes("romantic")
    ? "Frequently described as romantic with cozy atmosphere"
    : "Pleasant setting suitable for dates";

  // Option B – LLM boost (Featherless)
  const llmResponse = await callLLM(`
    Rate how romantic this place is for a date on a scale of 1-10.
    Name: ${name}
    Types: ${types}
    Summary: ${summary}
    Recent Reviews Snippets: ${reviews.slice(0, 500)}
    
    Give ONLY: number | one short sentence of explanation.
    Example: 8.5 | Beautiful river views and intimate candlelit tables.
  `);

  if (llmResponse && llmResponse.includes("|")) {
    const [llmScore, llmReason] = llmResponse.split("|").map(s => s.trim());
    const parsedScore = parseFloat(llmScore);
    if (!isNaN(parsedScore)) {
      score = parsedScore;
      reason = llmReason;
    }
  }

  return {
    ...activity,
    romanticScore: score,
    romanticReason: reason,
    // Preserve or update details from Google if useful
    address: placeData?.formattedAddress || activity.address,
    lat: placeData?.location?.latitude || activity.lat,
    lng: placeData?.location?.longitude || activity.lng,
  };
}

async function callAI(prompt, systemMessage = "You are a helpful assistant. Return strict valid JSON only.") {
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
          content: systemMessage,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!aiRes.ok) {
    const errorText = await aiRes.text();
    throw new Error(`AI API error: ${errorText}`);
  }

  const aiData = await aiRes.json();
  return aiData.choices?.[0]?.message?.content || "";
}

function buildPlanPrompt({
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
      : `The user has chosen this exact planning area: "${location}". You must keep the activities inside or very near this area and return usable addresses for each one.`;

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
- Use specific usable addresses whenever possible.
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

function buildMapActivityPrompt({
  query,
  currentAddress,
  chosenLocation,
  locationMode,
  vibe,
  budget,
}) {
  return `
Resolve this custom date activity into one real, mappable place.

Inputs:
- User activity idea: "${query}"
- Existing address, if any: "${currentAddress || ""}"
- Location context: "${chosenLocation || ""}"
- Location mode: "${locationMode || "specific"}"
- Vibe: "${vibe || "Romantic"}"
- Budget: "${budget || "Medium"}"

Instructions:
- Choose ONE realistic place that matches the activity idea.
- Prefer a place inside or very near the location context.
- If the activity idea is generic like "restaurant", "cafe", "museum", or "dessert", pick a suitable real-world place.
- Return a specific usable address.
- Do not return vague areas like "city centre" or "downtown".
- Return strict JSON only.

Return this exact JSON shape:
{
  "name": "",
  "address": ""
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

    const prompt = buildPlanPrompt({
      locationMode,
      location,
      locationPrompt,
      duration,
      budget,
      vibe,
    });

    let text;
    try {
      text = await callAI(
        prompt,
        "You are a date-planning assistant. Return strict valid JSON only."
      );
    } catch (error) {
      console.error(error.message);
      return res.status(502).json({
        error: "The AI service failed to generate a plan.",
      });
    }

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
          mappedCount: 0,
          totalCount: 0,
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
          if (looksTooVague(activity.address)) {
            return {
              ...activity,
              lat: null,
              lng: null,
              mappingError: "Address too vague",
            };
          }

          const coords = await geocodeWithFallback(activity.address, fallbackArea);

          return {
            ...activity,
            address: coords.resolvedAddress || activity.address,
            lat: coords.lat,
            lng: coords.lng,
            mappingError:
              coords.lat === null || coords.lng === null
                ? "Could not geocode address"
                : null,
          };
        } catch {
          return {
            ...activity,
            lat: null,
            lng: null,
            mappingError: "Geocoding failed",
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

app.post("/api/map-activity", async (req, res) => {
  try {
    const {
      query = "",
      currentAddress = "",
      chosenLocation = "",
      locationMode = "specific",
      vibe = "Romantic",
      budget = "Medium",
    } = req.body || {};

    if (!query.trim() && !currentAddress.trim()) {
      return res.status(400).json({
        error: "Please provide an activity name or address to map.",
      });
    }

    const prompt = buildMapActivityPrompt({
      query: query.trim(),
      currentAddress: currentAddress.trim(),
      chosenLocation: chosenLocation.trim(),
      locationMode,
      vibe,
      budget,
    });

    let text;
    try {
      text = await callAI(
        prompt,
        "You help map custom activities into real places. Return strict valid JSON only."
      );
    } catch (error) {
      console.error(error.message);
      return res.status(502).json({
        error: "The AI service failed to map this activity.",
      });
    }

    const parsed = extractJson(text);

    if (!parsed) {
      return res.status(500).json({
        error: "AI returned an invalid response format.",
      });
    }

    const placeName =
      typeof parsed.name === "string" && parsed.name.trim()
        ? parsed.name.trim()
        : query.trim() || "Custom activity";

    const placeAddress =
      typeof parsed.address === "string" && parsed.address.trim()
        ? parsed.address.trim()
        : currentAddress.trim();

    if (!placeAddress) {
      return res.status(200).json({
        name: placeName,
        address: "",
        lat: null,
        lng: null,
        mappingError: "AI could not find a usable address for this activity.",
      });
    }

    if (looksTooVague(placeAddress)) {
      return res.status(200).json({
        name: placeName,
        address: placeAddress,
        lat: null,
        lng: null,
        mappingError: "The suggested address is too vague to map.",
      });
    }

    const coords = await geocodeWithFallback(placeAddress, chosenLocation.trim());

    if (coords.lat === null || coords.lng === null) {
      return res.status(200).json({
        name: placeName,
        address: coords.resolvedAddress || placeAddress,
        lat: null,
        lng: null,
        mappingError: "Could not map this activity to a real location.",
      });
    }

    return res.json({
      name: placeName,
      address: coords.resolvedAddress || placeAddress,
      lat: coords.lat,
      lng: coords.lng,
      mappingError: null,
    });
  } catch (err) {
    console.error("Map activity error:", err);
    res.status(500).json({ error: "Failed to map activity" });
  }
});

app.listen(5555, () => {
  console.log("Backend running on http://localhost:5555");
});