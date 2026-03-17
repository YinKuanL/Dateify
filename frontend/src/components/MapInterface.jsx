import React, { useState, useEffect } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

// 1. Dark Mode Map Styling (Black and Grey)
const darkMapStyle = [
  { elementType: "geometry", stylers:[{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers:[{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers:[{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers:[{ color: "#9e9e9e" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry.fill", stylers:[{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers:[{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers:[{ color: "#3c3c3c" }] },
  { featureType: "transit", stylers:[{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers:[{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

// 2. Component that handles the actual routing logic
const Directions = ({ origin, destination }) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const[directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  // Initialize the Directions Service and Renderer
  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    // The renderer automatically draws the route and A/B markers on the map
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  // Request the route when origin or destination changes
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !origin || !destination) return;

    directionsService
      .route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
      })
      .catch((err) => console.error("Directions request failed:", err));
  }, [directionsService, directionsRenderer, origin, destination]);

  return null; // This component doesn't render HTML, it just interacts with the map canvas
};

// 3. Main Interface Component
const MapInterface = () => {
  // Default coordinates (e.g., Central London to Greenwich)
  const [route, setRoute] = useState({
    origin: { lat: 51.5072, lng: -0.1276 },
    destination: { lat: 51.4826, lng: -0.0077 }
  });

  // Local state for the input fields
  const[inputValues, setInputValues] = useState({
    origLat: 51.5072, origLng: -0.1276,
    destLat: 51.4826, destLng: -0.0077
  });

  const handleInputChange = (e) => {
    setInputValues({ ...inputValues, [e.target.name]: e.target.value });
  };

  const handleUpdateRoute = (e) => {
    e.preventDefault();
    setRoute({
      origin: { lat: parseFloat(inputValues.origLat), lng: parseFloat(inputValues.origLng) },
      destination: { lat: parseFloat(inputValues.destLat), lng: parseFloat(inputValues.destLng) }
    });
  };

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', backgroundColor: '#212121' }}>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        
        <Map
          defaultCenter={route.origin}
          defaultZoom={12}
          disableDefaultUI={true}
          styles={darkMapStyle} // Applies the black/grey theme
        >
          {/* Renders the route on the map */}
          <Directions origin={route.origin} destination={route.destination} />
        </Map>

      </APIProvider>

      {/* Input Card Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: '#1e1e1e',
          color: '#e0e0e0',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
          width: '320px',
          zIndex: 10,
          fontFamily: 'sans-serif'
        }}
      >
        <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#fff' }}>Route Planner</h2>
        
        <form onSubmit={handleUpdateRoute}>
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Location 1 (Origin)</strong>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="number" step="any" name="origLat" value={inputValues.origLat} onChange={handleInputChange}
                placeholder="Lat" required
                style={inputStyle}
              />
              <input 
                type="number" step="any" name="origLng" value={inputValues.origLng} onChange={handleInputChange}
                placeholder="Lng" required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <strong style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Location 2 (Destination)</strong>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="number" step="any" name="destLat" value={inputValues.destLat} onChange={handleInputChange}
                placeholder="Lat" required
                style={inputStyle}
              />
              <input 
                type="number" step="any" name="destLng" value={inputValues.destLng} onChange={handleInputChange}
                placeholder="Lng" required
                style={inputStyle}
              />
            </div>
          </div>

          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background 0.2s'
            }}
          >
            Update Route
          </button>
        </form>
      </div>
    </div>
  );
};

// Reusable style object for inputs to keep JSX clean
const inputStyle = {
  width: '100%',
  padding: '8px',
  backgroundColor: '#2c2c2c',
  border: '1px solid #444',
  borderRadius: '4px',
  color: '#fff',
  outline: 'none'
};

export default MapInterface;