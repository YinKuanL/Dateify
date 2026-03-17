import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PlanPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    location: "",
    duration: "",
    budget: "",
    vibe: "Romantic",
  });

  const [generatedPlan, setGeneratedPlan] = useState(null);
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleGeneratePlan() {
    // Temporary mock result for hackathon demo
    setGeneratedPlan({
      title: `${formData.vibe || "Perfect"} Date Plan`,
      summary: `A ${formData.duration || "3-hour"} date around ${
        formData.location || "your chosen area"
      } with a budget of ${formData.budget || "flexible"} budget.`,
      activities: [
        "Start with a cozy café stop",
        "Take a scenic walk together",
        "Enjoy dinner at a stylish restaurant",
      ],
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      <nav style={styles.nav}>
        <div style={styles.logo}>Dateify</div>
        <div style={styles.navLinks}>
          <button style={styles.navButton}>Plan</button>
          <button style={styles.navButton} onClick={() => navigate("/map")}>
            Map
          </button>
        </div>
      </nav>

      <main style={styles.main}>
        <section style={styles.left}>
          <div style={styles.badge}>AI Date Planner</div>
          <h1 style={styles.title}>Plan the perfect date in seconds.</h1>
          <p style={styles.subtitle}>
            Enter the vibe, budget, duration, and location. Our AI will build
            the full experience for you.
          </p>
        </section>

        <section style={styles.card}>
          <h2 style={styles.cardTitle}>Create your plan</h2>

          <div style={styles.form}>
            <input
              style={styles.input}
              type="text"
              name="location"
              placeholder="Enter location"
              value={formData.location}
              onChange={handleChange}
            />

            <select
              style={styles.input}
              name="duration"
              value={formData.duration}
              onChange={handleChange}
            >
              <option value="">Select duration</option>
              <option value="2 hours">2 hours</option>
              <option value="4 hours">4 hours</option>
              <option value="All evening">All evening</option>
            </select>

            <select
              style={styles.input}
              name="budget"
              value={formData.budget}
              onChange={handleChange}
            >
              <option value="">Select budget</option>
              <option value="Budget-friendly">Budget-friendly</option>
              <option value="Medium">Medium</option>
              <option value="Luxury">Luxury</option>
            </select>

            <select
              style={styles.input}
              name="vibe"
              value={formData.vibe}
              onChange={handleChange}
            >
              <option value="Romantic">Romantic</option>
              <option value="Chill">Chill</option>
              <option value="Foodie">Foodie</option>
              <option value="Adventurous">Adventurous</option>
            </select>

            <button style={styles.primaryButton} onClick={handleGeneratePlan}>
              Generate Plan
            </button>
          </div>

          {generatedPlan && (
            <div style={styles.resultCard}>
              <h3 style={styles.resultTitle}>{generatedPlan.title}</h3>
              <p style={styles.resultSummary}>{generatedPlan.summary}</p>

              <ul style={styles.activityList}>
                {generatedPlan.activities.map((activity, index) => (
                  <li key={index} style={styles.activityItem}>
                    {activity}
                  </li>
                ))}
              </ul>

              <button style={styles.secondaryButton} onClick={() => navigate("/map")}>
                View Route Map
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0B0D0F",
    color: "#F5F7FA",
    position: "relative",
    overflow: "hidden",
    padding: "24px",
    fontFamily: "Inter, sans-serif",
  },
  glow1: {
    position: "absolute",
    top: "-120px",
    left: "-120px",
    width: "320px",
    height: "320px",
    background: "rgba(30,215,96,0.18)",
    filter: "blur(120px)",
    borderRadius: "50%",
  },
  glow2: {
    position: "absolute",
    bottom: "-100px",
    right: "-100px",
    width: "320px",
    height: "320px",
    background: "rgba(255,79,163,0.15)",
    filter: "blur(120px)",
    borderRadius: "50%",
  },
  nav: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "24px",
    position: "relative",
    zIndex: 2,
  },
  logo: {
    fontSize: "24px",
    fontWeight: 800,
  },
  navLinks: {
    display: "flex",
    gap: "12px",
  },
  navButton: {
    background: "transparent",
    color: "#A7B0BA",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
  },
  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "32px",
    alignItems: "center",
    minHeight: "calc(100vh - 100px)",
    position: "relative",
    zIndex: 2,
  },
  left: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  badge: {
    display: "inline-block",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#A7B0BA",
    width: "fit-content",
    fontSize: "14px",
  },
  title: {
    fontSize: "60px",
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: "-0.04em",
  },
  subtitle: {
    fontSize: "18px",
    lineHeight: 1.6,
    color: "#A7B0BA",
    maxWidth: "560px",
  },
  card: {
    borderRadius: "28px",
    padding: "28px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(18px)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: 700,
    marginBottom: "20px",
  },
  form: {
    display: "grid",
    gap: "16px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#F5F7FA",
    fontSize: "15px",
    outline: "none",
  },
  primaryButton: {
    padding: "14px 18px",
    border: "none",
    borderRadius: "18px",
    background: "#1ED760",
    color: "#08110B",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 0 30px rgba(30,215,96,0.25)",
    marginTop: "8px",
  },
  resultCard: {
    marginTop: "24px",
    padding: "20px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  resultTitle: {
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "10px",
  },
  resultSummary: {
    color: "#A7B0BA",
    marginBottom: "14px",
    lineHeight: 1.6,
  },
  activityList: {
    paddingLeft: "18px",
    marginBottom: "18px",
    color: "#F5F7FA",
  },
  activityItem: {
    marginBottom: "8px",
  },
  secondaryButton: {
    padding: "12px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#F5F7FA",
    cursor: "pointer",
  },
};