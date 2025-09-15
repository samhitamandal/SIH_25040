import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import Dashboard from './components/Dashboard';
import mockArgoFloat from './components/argoData';
import './styles.css';

function App() {
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [clickedLat, setClickedLat] = useState(null);
  const [clickedLng, setClickedLng] = useState(null);

  const handleMapClick = (lat, lng) => {
    setClickedLat(lat);
    setClickedLng(lng);
    setDashboardVisible(true);
  };

  const handleCloseDashboard = () => {
    setDashboardVisible(false);
    setClickedLat(null);
    setClickedLng(null);
  };

  return (
    <div className="App">
      <MapComponent 
        onMapClick={handleMapClick}
        clickedLat={clickedLat}
        clickedLng={clickedLng}
      />
      {dashboardVisible && (
        <Dashboard
          data={mockArgoFloat}
          onClose={handleCloseDashboard}
          latitude={clickedLat}
          longitude={clickedLng}
        />
      )}
    </div>
  );
}

export default App;