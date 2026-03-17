import React, { useEffect, useMemo, useState } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useLocation, useNavigate } from "react-router-dom";

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] },
];

function Directions({ activities }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  const validActivities = useMemo(
    () =>
      (activities || []).filter(
        (item) =>
          item &&
          typeof item.lat === "number" &&
          typeof item.lng === "number"
      ),
    [activities]
  );

  useEffect(() => {
    if (!routesLibrary || !map) return;

    const service = new routesLibrary.DirectionsService();
    const renderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#1ED760",
        strokeOpacity: 0.95,
        strokeWeight: 5,
      },
    });

    setDirectionsService(service);
    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;
    if (validActivities.length < 2) return;

    const origin = {
      lat: validActivities[0].lat,
      lng: validActivities[0].lng,
    };

    const destination = {
      lat: validActivities[validActivities.length - 1].lat,
      lng: validActivities[validActivities.length - 1].lng,
    };

    const waypoints = validActivities.slice(1, -1).map((activity) => ({
      location: { lat: activity.lat, lng: activity.lng },
      stopover: true,
    }));

    directionsService
      .route({
        origin,
        destination,
        waypoints,
        optimizeWaypoints: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
      })
      .catch((err) => {
        console.error("Directions request failed:", err);
      });
  }, [directionsService, directionsRenderer, validActivities]);

  return null;
}

const MapInterface = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;

  const activities = plan?.activities || [];

  const validActivities = activities.filter(
    (item) =>
      item &&
      typeof item.lat === "number" &&
      typeof item.lng === "number"
  );

  const defaultCenter =
    validActivities.length > 0
      ? { lat: validActivities[0].lat, lng: validActivities[0].lng }
      : { lat: 51.5072, lng: -0.1276 };

  return (
    <div style={styles.page}>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={13}
          gestureHandling="greedy"
          disableDefaultUI={true}
          styles={darkMapStyle}
        >
          {validActivities.map((activity, index) => (
            <Marker
              key={`${activity.name}-${index}`}
              position={{ lat: activity.lat, lng: activity.lng }}
              title={`${index + 1}. ${activity.name}`}
            />
          ))}

          {validActivities.length >= 2 && (
            <Directions activities={validActivities} />
          )}
        </Map>
      </APIProvider>

      <div style={styles.sidebar}>
        <button onClick={() => navigate("/")} style={styles.backButton}>
          ← Back to Plan
        </button>

        <div style={styles.headerBlock}>
          <div style={styles.badge}>Route Map</div>
          <h2 style={styles.title}>
            {plan?.title || "Your Date Route"}
          </h2>
          <p style={styles.summary}>
            {plan?.summary ||
              "Generate a plan first to see your route and activities here."}
          </p>
        </div>

        <div style={styles.sectionTitle}>Activities</div>

        <div style={styles.activityList}>
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <div key={`${activity.name}-${index}`} style={styles.activityCard}>
                <div style={styles.activityNumber}>{index + 1}</div>

                <div style={styles.activityContent}>
                  <div style={styles.activityName}>
                    {activity.name || "Unnamed activity"}
                  </div>
                  <div style={styles.activityAddress}>
                    {activity.address || "No address available"}
                  </div>
                  <div style={styles.coordText}>
                    {typeof activity.lat === "number" &&
                    typeof activity.lng === "number"
                      ? `${activity.lat.toFixed(4)}, ${activity.lng.toFixed(4)}`
                      : "No coordinates"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>
              No plan data found. Go back and generate a date plan first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    position: "fixed",
    inset: 0,
    background: "#0B0D0F",
    overflow: "hidden",
  },
  sidebar: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 360,
    maxHeight: "calc(100vh - 40px)",
    overflowY: "auto",
    zIndex: 10,
    padding: 22,
    borderRadius: 24,
    background: "rgba(15,18,22,0.88)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
    color: "#F5F7FA",
    fontFamily: "Inter, sans-serif",
  },
  backButton: {
    marginBottom: 18,
    background: "transparent",
    border: "none",
    color: "#1ED760",
    cursor: "pointer",
    padding: 0,
    fontSize: 14,
    fontWeight: 700,
  },
  headerBlock: {
    marginBottom: 20,
  },
  badge: {
    display: "inline-block",
    marginBottom: 12,
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(30,215,96,0.10)",
    border: "1px solid rgba(30,215,96,0.18)",
    color: "#7EF0A5",
    fontSize: 12,
    fontWeight: 700,
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: 24,
    lineHeight: 1.1,
    fontWeight: 800,
    letterSpacing: "-0.03em",
  },
  summary: {
    margin: 0,
    color: "#A7B0BA",
    fontSize: 14,
    lineHeight: 1.6,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#A7B0BA",
  },
  activityList: {
    display: "grid",
    gap: 12,
  },
  activityCard: {
    display: "grid",
    gridTemplateColumns: "40px 1fr",
    gap: 12,
    alignItems: "start",
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  activityNumber: {
    width: 40,
    height: 40,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(30,215,96,0.12)",
    color: "#7EF0A5",
    fontWeight: 800,
    fontSize: 14,
  },
  activityContent: {
    display: "grid",
    gap: 4,
  },
  activityName: {
    fontSize: 15,
    fontWeight: 700,
    color: "#F5F7FA",
  },
  activityAddress: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#A7B0BA",
  },
  coordText: {
    marginTop: 4,
    fontSize: 12,
    color: "#6F7A86",
  },
  emptyState: {
    padding: 16,
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#A7B0BA",
    lineHeight: 1.6,
  },
};

export default MapInterface;