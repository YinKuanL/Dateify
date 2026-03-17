## Inspiration

Planning the perfect date is surprisingly stressful—deciding where to go, what to do, how to get there, and whether everything fits together smoothly. Many people either spend too much time planning or end up with generic, uninspired experiences.  

We wanted to solve this by creating an AI-powered system that not only **generates personalised date ideas**, but also **connects them into a seamless, real-world experience**—from planning to routing and booking.

---

## What it does

**Dateify** is an AI-powered date planning platform that:

- ✨ Generates personalised date plans based on location, budget, duration, and vibe  
- 🧠 Uses AI to suggest meaningful, context-aware activities  
- 🛠️ Allows users to fully customise every activity  
- 🗺️ Visualises the entire plan on an interactive map with routes  
- 📍 Displays all locations in order with travel time and distance  
- 📦 (In progress) Simulates booking the entire plan in one click  

In short, Dateify takes you from **“I have no idea what to do” → “Everything is planned and ready”** in seconds.

---

## How we built it

We built Dateify using a full-stack architecture:

**Frontend**
- React (with hooks)
- Custom UI styling (dark mode + modern glassmorphism)
- Google Maps via `@vis.gl/react-google-maps`

**Backend**
- Node.js + Express
- REST API for plan generation and booking simulation

**AI Integration**
- Featherless AI API for generating structured date plans
- Prompt engineering to convert user inputs into actionable activities

**Mapping & Routing**
- Google Maps Directions API
- Dynamic route rendering with multiple waypoints
- Auto-fit bounds for any city (e.g., London, Hong Kong)

---

## Challenges we ran into

- 🧩 Handling AI-generated locations and converting them into valid coordinates  
- 🗺️ Synchronising map updates (markers, routes, and bounds) across different cities  
- 🎯 Maintaining consistent UI design between plan and map pages  
- 🤖 Ensuring AI outputs are structured and usable (not just text)  
- 🔗 Connecting frontend, backend, and AI into a smooth pipeline  

---

## Accomplishments that we're proud of

- 🚀 Built a fully working **AI → plan → map → route pipeline**
- 🧠 Enabled users to **edit AI-generated plans dynamically**
- 🗺️ Implemented **multi-location routing with real-time visualisation**
- 🎨 Designed a clean, modern UI with a consistent design system  
- 💡 Created a scalable product idea with real-world potential  

---

## What we learned

- Integrating AI into real applications beyond chat interfaces  
- The importance of **structured outputs (JSON vs free text)**  
- Managing complex state across React components  
- Working with external APIs like Google Maps  
- Balancing **automation (AI)** with **user control**

---

## What's next for Dateify

- 🤖 Real booking integrations (restaurants, activities, transport APIs)  
- 💳 Payment system for full end-to-end booking  
- 📍 Smarter recommendations based on user preferences  
- 🧠 Advanced AI for itinerary optimisation  
- 📱 Mobile-friendly version / app  
- 👥 Social features (sharing and co-planning)

---
