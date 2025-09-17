import React, { useState } from 'react';
import MapComponent from './components/MapComponent';
import Dashboard from './components/Dashboard2';
import Sidebar from './components/Sidebar';
import ChatbotInterface from './components/ChatbotInterface';
import './styles.css';

// New component for the top navigation bar
const TopNavbar = ({ setView, toggleSidebar, isSidebarOpen }) => {
  return (
    <div className="top-navbar">
      <div className="nav-buttons">
        <button className="nav-btn" onClick={() => setView('map')}>Dashboard</button>
        <button className="nav-btn" onClick={() => setView('chatbot')}>FloatChat</button>
      </div>
      <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
        {isSidebarOpen ? 'Close Trajectories' : 'Argo Trajectories'}
      </button>
    </div>
  );
};

function App() {
  const [view, setView] = useState('map'); // 'map' or 'chatbot'
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [clickedLat, setClickedLat] = useState(null);
  const [clickedLng, setClickedLng] = useState(null);
  const [trajectories, setTrajectories] = useState([]);
  const [isLoadingTraj, setIsLoadingTraj] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

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

  const normalizeId = (id) => {
    let cleaned = id.trim();
    if (cleaned.toLowerCase().startsWith('np.int64(') && cleaned.endsWith(')')) {
      cleaned = cleaned.slice(9, -1);
    }
    cleaned = cleaned.replace(/[^0-9]/g, '');
    return cleaned;
  };

  const fetchTrajectories = async (inputIds) => {
    const ids = inputIds.map(normalizeId).filter(Boolean);
    if (ids.length === 0) return;
    setIsLoadingTraj(true);
    try {
      const params = new URLSearchParams();
      ids.forEach(id => params.append('argo_ids', id));
      const url = `http://127.0.0.1:8080/api/trajectories?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to fetch trajectories');
      }
      const data = await res.json();
      setTrajectories(data.trajectories || []);
    } catch (e) {
      console.error(e);
      setTrajectories([]);
    } finally {
      setIsLoadingTraj(false);
    }
  };

  const renderContent = () => {
    if (view === 'chatbot') {
      return (
        <div className="main-content chatbot-view">
          <ChatbotInterface />
        </div>
      );
    }
    
    return (
      <div className="main-content map-view">
        <MapComponent 
          onMapClick={handleMapClick}
          clickedLat={clickedLat}
          clickedLng={clickedLng}
          trajectories={trajectories}
        />
        <Sidebar 
          onPlot={fetchTrajectories} 
          isLoading={isLoadingTraj} 
          isOpen={isSidebarOpen}
        />
        {dashboardVisible && (
          <Dashboard
            onClose={handleCloseDashboard}
            latitude={clickedLat}
            longitude={clickedLng}
          />
        )}
      </div>
    );
  };

  return (
    <div className="App">
      <TopNavbar setView={setView} toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      {renderContent()}
    </div>
  );
}

export default App;