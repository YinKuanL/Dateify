import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

// Simple mock/test of the enrichment logic
// Note: This requires the backend server to be running if testing via API, 
// or we can test the function directly if exported.
// For now, let's try to test the enrichment function logic by simulating its inputs.

const API_KEY = process.env.FEATHERLESS_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

console.log("Checking API Keys...");
console.log("FEATHERLESS_API_KEY:", API_KEY ? "Present" : "Missing");
console.log("GOOGLE_MAPS_API_KEY:", GOOGLE_MAPS_API_KEY ? "Present" : "Missing");

async function testEnrichment() {
  const sampleActivity = {
    name: "Coarse Restaurant",
    address: "Reform Place, Durham DH1 4RZ"
  };

  console.log("\nTesting enrichment for:", sampleActivity.name);
  
  // Since we haven't exported the function from server.js, we'll test via the endpoint
  // but that requires Featherless AI to run too.
  
  // Alternatively, we can just check if the server starts without errors and handles missing keys.
  console.log("To fully test, please ensure the server is running and send a request to /api/plan-date.");
  console.log("Example request payload:");
  console.log(JSON.stringify({
    locationMode: "specific",
    location: "Durham, UK",
    vibe: "Romantic"
  }, null, 2));
}

testEnrichment();
