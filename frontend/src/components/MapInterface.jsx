import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const MapInterface = () => {
  // Default center (e.g., London)
  const [center, setCenter] = useState({ lat: 51.5072, lng: -0.1276 });
  const [zoom, setZoom] = useState(13);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {/* Google Maps API Provider */}
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
          center={center}
          zoom={zoom}
          mapId="DEMO_MAP_ID" // Required for Advanced Markers
          disableDefaultUI={true} // Hides default Google UI for a cleaner look
          onCameraChanged={(ev) => {
            setCenter(ev.detail.center);
            setZoom(ev.detail.zoom);
          }}
        >
          {/* Example Marker */}
          <AdvancedMarker position={{ lat: 51.5072, lng: -0.1276 }}>
            <Pin background={'#EF4444'} borderColor={'#7F1D1D'} glyphColor={'#FFFFFF'} />
          </AdvancedMarker>
        </Map>
      </APIProvider>

      {/* Floating UI Overlay (Sidebar/Panel) */}
      <div 
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          width: '300px',
          zIndex: 10 // Ensures it sits on top of the map
        }}
      >
        <h1 style={{ margin: '0 0 10px 0', fontSize: '20px', fontFamily: 'sans-serif' }}>
          My Map App
        </h1>
        <p style={{ fontFamily: 'sans-serif', color: '#666', fontSize: '14px' }}>
          Current Location: <br/>
          Lat: {center.lat.toFixed(4)} <br/>
          Lng: {center.lng.toFixed(4)}
        </p>
        <button 
          onClick={() => setCenter({ lat: 40.7128, lng: -74.0060 })} // Jump to NYC
          style={{
            marginTop: '15px',
            padding: '10px',
            width: '100%',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Jump to New York
        </button>
      </div>
    </div>
  );
};

export default MapInterface;
