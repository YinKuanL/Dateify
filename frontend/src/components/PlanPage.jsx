import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PlanPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    locationMode: "specific",
    location: "",
    locationPrompt: "",
    duration: "",
    budget: "",
    vibe: "Romantic",
  });

  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [warningMessage, setWarningMessage] = useState("");

  const canViewMap = useMemo(() => {
    return Boolean(
      generatedPlan?.activities?.some(
        (activity) => activity.lat !== null && activity.lng !== null
      )
    );
  }, [generatedPlan]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function validateForm() {
    if (
      formData.locationMode === "specific" &&
      !formData.location.trim()
    ) {
      return "Please enter a location.";
    }

    if (
      formData.locationMode === "ai-generated" &&
      !formData.locationPrompt.trim()
    ) {
      return "Please describe the type of location you want AI to generate.";
    }

    if (!formData.duration) {
      return "Please select a duration.";
    }

    if (!formData.budget) {
      return "Please select a budget.";
    }

    return "";
  }

  async function handleGeneratePlan() {
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setWarningMessage("");

    try {
      const payload = {
        ...formData,
        location:
          formData.locationMode === "specific" ? formData.location.trim() : "",
        locationPrompt:
          formData.locationMode === "ai-generated"
            ? formData.locationPrompt.trim()
            : "",
      };

      const response = await fetch("http://localhost:5555/api/plan-date", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setGeneratedPlan(null);
        setErrorMessage(data.error || "Failed to generate plan.");
        return;
      }

      if (!Array.isArray(data.activities) || data.activities.length === 0) {
        setGeneratedPlan(data);
        setWarningMessage(
          data.meta?.message ||
            "AI could not find suitable locations. Try a broader area or edit the prompt."
        );
        return;
      }

      const hasMappedActivities = data.activities.some(
        (activity) => activity.lat !== null && activity.lng !== null
      );

      if (!hasMappedActivities) {
        setWarningMessage(
          data.meta?.message ||
            "Plan generated, but none of the locations could be mapped. You can still edit the addresses manually."
        );
      } else if (data.meta?.partialLocationFailure) {
        setWarningMessage(
          data.meta?.message ||
            "Plan generated, but some locations could not be mapped."
        );
      }

      setGeneratedPlan(data);
    } catch (error) {
      console.error("Failed to generate plan:", error);
      setGeneratedPlan(null);
      setErrorMessage("Something went wrong while generating the plan.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleActivityChange(index, field, value) {
    setGeneratedPlan((prev) => {
      if (!prev) return prev;

      const updated = [...prev.activities];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      if (field === "address") {
        updated[index].lat = null;
        updated[index].lng = null;
      }

      return { ...prev, activities: updated };
    });
  }

  function handleAddActivity() {
    setGeneratedPlan((prev) => ({
      ...(prev || {
        title: "Custom Date Plan",
        summary: "A personalised plan you can edit manually.",
        activities: [],
      }),
      activities: [
        ...(prev?.activities || []),
        {
          name: "New custom activity",
          address: "",
          lat: null,
          lng: null,
        },
      ],
    }));
  }

  function handleRemoveActivity(index) {
    setGeneratedPlan((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index),
    }));
  }

  function handleGoToMap() {
    if (!generatedPlan) return;

    const validActivities = generatedPlan.activities.filter(
      (activity) => activity.lat !== null && activity.lng !== null
    );

    if (validActivities.length === 0) {
      setWarningMessage(
        "No valid mapped locations found yet. Please edit the activity addresses or regenerate the plan."
      );
      return;
    }

    navigate("/map", {
      state: {
        plan: {
          ...generatedPlan,
          activities: validActivities,
        },
      },
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      <nav style={styles.nav}>
        <div style={styles.logoWrap}>
          <div style={styles.logoDot}></div>
          <div style={styles.logo}>Dateify</div>
        </div>

        <div style={styles.navLinks}>
          <button style={{ ...styles.navButton, ...styles.navButtonActive }}>
            Plan
          </button>
          <button style={styles.navButton} onClick={() => navigate("/map")}>
            Map
          </button>
        </div>
      </nav>

      <main style={styles.main}>
        <section style={styles.left}>
          <div style={styles.badge}>AI Date Planner</div>

          <h1 style={styles.title}>
            Plan the perfect date,
            <br />
            then tailor it your way.
          </h1>

          <p style={styles.subtitle}>
            Our AI suggests the ideal activities based on your vibe, budget,
            duration, and location. Then you can customise every step before
            viewing the route.
          </p>

          <div style={styles.featureRow}>
            <div style={styles.featureCard}>
              <div style={styles.featureTitle}>AI Suggestions</div>
              <div style={styles.featureText}>
                Instant activity ideas matched to your vibe.
              </div>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureTitle}>Customisable Plan</div>
              <div style={styles.featureText}>
                Edit, remove, or add your own activities easily.
              </div>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Create your plan</h2>
              <p style={styles.cardSubtitle}>
                Start with AI, then personalise it.
              </p>
            </div>
          </div>

          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Location Type</label>
              <select
                style={styles.select}
                name="locationMode"
                value={formData.locationMode}
                onChange={handleChange}
              >
                <option value="specific">Choose a specific location</option>
                <option value="ai-generated">Let AI suggest the location</option>
              </select>
            </div>

            {formData.locationMode === "specific" ? (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Location</label>
                <input
                  style={styles.input}
                  type="text"
                  name="location"
                  placeholder="Enter city, area, or neighbourhood"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
            ) : (
              <div style={styles.inputGroup}>
                <label style={styles.label}>AI Location Prompt</label>
                <textarea
                  style={styles.textarea}
                  name="locationPrompt"
                  placeholder="Example: Somewhere quiet by the river in London, good for a romantic evening walk and dinner"
                  value={formData.locationPrompt}
                  onChange={handleChange}
                />
              </div>
            )}

            <div style={styles.twoCol}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Duration</label>
                <select
                  style={styles.select}
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                >
                  <option value="">Select duration</option>
                  <option value="1 hour">1 hour</option>
                  <option value="2 hours">2 hours</option>
                  <option value="3 hours">3 hours</option>
                  <option value="4 hours">4 hours</option>
                  <option value="5 hours">5 hours</option>
                  <option value="6 hours">6 hours</option>
                  <option value="Half day">Half day</option>
                  <option value="All evening">All evening</option>
                  <option value="Full day">Full day</option>
                  <option value="Weekend">Weekend</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Budget</label>
                <select
                  style={styles.select}
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                >
                  <option value="">Select budget</option>
                  <option value="Budget-friendly">Budget-friendly</option>
                  <option value="Medium">Medium</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Vibe</label>
              <select
                style={styles.select}
                name="vibe"
                value={formData.vibe}
                onChange={handleChange}
              >
                <option value="Romantic">Romantic</option>
                <option value="Chill">Chill</option>
                <option value="Foodie">Foodie</option>
                <option value="Adventurous">Adventurous</option>
              </select>
            </div>

            <button
              style={styles.primaryButton}
              onClick={handleGeneratePlan}
              disabled={isLoading}
            >
              {isLoading ? "Generating..." : "Generate AI Plan"}
            </button>

            {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}
            {warningMessage && (
              <div style={styles.warningBox}>{warningMessage}</div>
            )}
          </div>

          {generatedPlan && (
            <div style={styles.resultCard}>
              <div style={styles.resultTop}>
                <div>
                  <h3 style={styles.resultTitle}>{generatedPlan.title}</h3>
                  <p style={styles.resultSummary}>{generatedPlan.summary}</p>
                  {generatedPlan.chosenLocation && (
                    <p style={styles.chosenLocation}>
                      Area: {generatedPlan.chosenLocation}
                    </p>
                  )}
                </div>
                <div style={styles.aiPill}>AI Suggested</div>
              </div>

              <div style={styles.sectionLabel}>Activities</div>

              <div style={styles.activityList}>
                {generatedPlan.activities.map((activity, index) => (
                  <div key={index} style={styles.activityCard}>
                    <div style={styles.activityNumber}>{index + 1}</div>

                    <div style={styles.activityContent}>
                      <input
                        style={styles.activityInput}
                        value={activity.name}
                        onChange={(e) =>
                          handleActivityChange(index, "name", e.target.value)
                        }
                      />

                      <input
                        style={styles.activityAddressInput}
                        value={activity.address || ""}
                        placeholder="Enter activity address"
                        onChange={(e) =>
                          handleActivityChange(index, "address", e.target.value)
                        }
                      />

                      <div style={styles.locationStatus}>
                        {activity.lat !== null && activity.lng !== null
                          ? "Mapped"
                          : "Not mapped yet"}
                      </div>
                    </div>

                    <button
                      style={styles.removeButton}
                      onClick={() => handleRemoveActivity(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <button style={styles.addButton} onClick={handleAddActivity}>
                + Add Custom Activity
              </button>

              <div style={styles.actionRow}>
                <button
                  style={styles.secondaryButton}
                  onClick={handleGeneratePlan}
                  disabled={isLoading}
                >
                  Regenerate
                </button>

                <button
                  style={{
                    ...styles.primaryButtonSmall,
                    opacity: canViewMap ? 1 : 0.5,
                    cursor: canViewMap ? "pointer" : "not-allowed",
                  }}
                  onClick={handleGoToMap}
                  disabled={!canViewMap}
                >
                  View Route Map
                </button>
              </div>
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
    background:
      "radial-gradient(circle at top left, rgba(30,215,96,0.08), transparent 28%), radial-gradient(circle at bottom right, rgba(255,79,163,0.08), transparent 28%), #0B0D0F",
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
    pointerEvents: "none",
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
    pointerEvents: "none",
  },
  nav: {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "24px",
    position: "relative",
    zIndex: 2,
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1ED760, #FF4FA3)",
    boxShadow: "0 0 18px rgba(30,215,96,0.45)",
  },
  logo: {
    fontSize: "24px",
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  navLinks: {
    display: "flex",
    gap: "12px",
  },
  navButton: {
    background: "rgba(255,255,255,0.04)",
    color: "#A7B0BA",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "10px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "0.2s ease",
  },
  navButtonActive: {
    color: "#F5F7FA",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
  },
  main: {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1.05fr 0.95fr",
    gap: "32px",
    alignItems: "start",
    minHeight: "calc(100vh - 100px)",
    position: "relative",
    zIndex: 2,
    paddingTop: "20px",
  },
  left: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    paddingTop: "40px",
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
    fontSize: "64px",
    lineHeight: 0.98,
    fontWeight: 800,
    letterSpacing: "-0.05em",
    maxWidth: "680px",
  },
  subtitle: {
    fontSize: "18px",
    lineHeight: 1.7,
    color: "#A7B0BA",
    maxWidth: "620px",
  },
  featureRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    marginTop: "8px",
  },
  featureCard: {
    flex: "1 1 220px",
    minWidth: "220px",
    padding: "18px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
  },
  featureTitle: {
    fontSize: "16px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  featureText: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#A7B0BA",
  },
  card: {
    borderRadius: "30px",
    padding: "28px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
  },
  cardHeader: {
    marginBottom: "20px",
  },
  cardTitle: {
    fontSize: "28px",
    fontWeight: 800,
    marginBottom: "6px",
    letterSpacing: "-0.03em",
  },
  cardSubtitle: {
    color: "#A7B0BA",
    fontSize: "15px",
    lineHeight: 1.5,
  },
  form: {
    display: "grid",
    gap: "16px",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  inputGroup: {
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    color: "#A7B0BA",
    fontWeight: 600,
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
  textarea: {
    width: "100%",
    minHeight: "96px",
    padding: "14px 16px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#F5F7FA",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    fontFamily: "Inter, sans-serif",
  },
  primaryButton: {
    padding: "15px 18px",
    border: "none",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #1ED760, #39E97C)",
    color: "#08110B",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 0 30px rgba(30,215,96,0.25)",
    marginTop: "8px",
  },
  resultCard: {
    marginTop: "24px",
    padding: "22px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  resultTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "18px",
  },
  resultTitle: {
    fontSize: "22px",
    fontWeight: 800,
    marginBottom: "8px",
    letterSpacing: "-0.02em",
  },
  resultSummary: {
    color: "#A7B0BA",
    lineHeight: 1.65,
    fontSize: "15px",
    maxWidth: "520px",
  },
  chosenLocation: {
    color: "#D8E0E8",
    fontSize: "13px",
    marginTop: "10px",
  },
  aiPill: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    background: "rgba(30,215,96,0.12)",
    color: "#7EF0A5",
    border: "1px solid rgba(30,215,96,0.2)",
    whiteSpace: "nowrap",
  },
  sectionLabel: {
    fontSize: "13px",
    color: "#A7B0BA",
    fontWeight: 700,
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  activityList: {
    display: "grid",
    gap: "12px",
  },
  activityCard: {
    display: "grid",
    gridTemplateColumns: "40px 1fr auto",
    gap: "12px",
    alignItems: "center",
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  activityNumber: {
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(30,215,96,0.12)",
    color: "#7EF0A5",
    fontWeight: 800,
    fontSize: "14px",
  },
  activityContent: {
    display: "grid",
    gap: "8px",
  },
  activityInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#F5F7FA",
    fontSize: "15px",
  },
  activityAddressInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#A7B0BA",
    fontSize: "13px",
    outline: "none",
  },
  locationStatus: {
    fontSize: "12px",
    color: "#A7B0BA",
  },
  removeButton: {
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "#A7B0BA",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
  addButton: {
    marginTop: "14px",
    padding: "12px 14px",
    width: "100%",
    borderRadius: "16px",
    border: "1px dashed rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.03)",
    color: "#C9D1D9",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
  },
  actionRow: {
    display: "flex",
    gap: "12px",
    marginTop: "18px",
  },
  secondaryButton: {
    flex: 1,
    padding: "13px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    color: "#F5F7FA",
    cursor: "pointer",
    fontWeight: 700,
  },
  primaryButtonSmall: {
    flex: 1,
    padding: "13px 16px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #1ED760, #39E97C)",
    color: "#08110B",
    fontSize: "15px",
    fontWeight: 800,
    boxShadow: "0 0 30px rgba(30,215,96,0.2)",
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.6)",
    color: "#F5F7FA",
    fontSize: "15px",
    outline: "none",
    colorScheme: "dark",
  },
  errorBox: {
    padding: "12px 14px",
    borderRadius: "14px",
    background: "rgba(255, 79, 79, 0.10)",
    border: "1px solid rgba(255, 79, 79, 0.22)",
    color: "#FFB4B4",
    fontSize: "14px",
  },
  warningBox: {
    padding: "12px 14px",
    borderRadius: "14px",
    background: "rgba(255, 193, 7, 0.10)",
    border: "1px solid rgba(255, 193, 7, 0.22)",
    color: "#FFD66B",
    fontSize: "14px",
  },
};