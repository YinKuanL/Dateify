import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";

import PlanPage from "./components/PlanPage";
import MapInterface from "./components/MapInterface";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PlanPage />} />
        <Route path="/map" element={<MapInterface />} />
      </Routes>
    </Router>
  );
}

export default App;