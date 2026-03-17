import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MapInterface from './components/MapInterface';

// A placeholder for your main application page
const HomePage = () => {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Main Application Page</h1>
      <p>This is your standard index page. It has normal scrolling and its own styles.</p>
      
      <Link 
        to="/map" 
        style={{ 
          display: 'inline-block', 
          marginTop: '20px', 
          padding: '10px 20px', 
          backgroundColor: '#3B82F6', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '6px' 
        }}
      >
        Open Route Planner Map
      </Link>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* The standard index page */}
        <Route path="/" element={<HomePage />} />
        
        {/* The isolated map interface */}
        <Route path="/map" element={<MapInterface />} />
      </Routes>
    </Router>
  );
}

export default App;