import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import Plot from 'react-plotly.js';
import 'react-datepicker/dist/react-datepicker.css';

const colorPalette = {
  temperature: '#E55451',
  salinity: '#5D8AA8',
};

const Dashboard = ({ onClose, latitude, longitude }) => {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const [startDate, setStartDate] = useState(fiveYearsAgo);
  const [endDate, setEndDate] = useState(new Date());
  
  const [selectedGraph, setSelectedGraph] = useState('temperature_10');
  
  const [plotProfiles, setPlotProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setPlotProfiles([]);

    const [variable, _depth] = selectedGraph.split('_');
    
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    const url = `http://127.0.0.1:8080/api/timeseries_at_depth/?lat=${latitude}&lng=${longitude}&start_date=${startDateString}&end_date=${endDateString}&depth=${depth}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch data');
      }
      const data = await response.json();
      setPlotProfiles(data.profiles);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlotData = () => {
    const [variable] = selectedGraph.split('_');
    const name = variable === 'temperature' ? 'Temperature (°C)' : 'Salinity (PSU)';
    
    // --- THIS IS THE FIX ---
    // Dynamically choose the correct data key based on the selected variable
    const dataKey = variable === 'temperature' ? 'avg_temperature' : 'avg_salinity';

    const plotDates = plotProfiles.map((p) => p.time);
    const plotYData = plotProfiles.map((p) => p[dataKey]); // Use the dynamic dataKey here

    return [{
      x: plotDates,
      y: plotYData,
      mode: 'lines+markers',
      name: name,
      marker: { color: colorPalette[variable], size: 6 },
      line: { color: colorPalette[variable], width: 2 },
    }];
  };

  const plotLayout = {
    title: `Data for Grid Cell at ${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
    height: 500,
    autosize: true,
    margin: { l: 60, r: 60, b: 60, t: 80 },
    xaxis: { title: 'Date' },
    yaxis: { title: getPlotData()[0]?.name || '' },
  };

  return (
    <div className="dashboard-container">
      <button className="dashboard-close-btn" onClick={onClose}>&times;</button>
      <h2>Oceanographic Dashboard</h2>

      <div className="dashboard-section">
        <h3>Metadata for Clicked Location</h3>
        <p><strong>Latitude:</strong> {latitude.toFixed(4)}°</p>
        <p><strong>Longitude:</strong> {longitude.toFixed(4)}°</p>
      </div>

      <div className="dashboard-section date-range-selection">
        <h3>Select Date Range</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div>
            <label>From:</label>
            <DatePicker selected={startDate} onChange={date => setStartDate(date)} selectsStart startDate={startDate} endDate={endDate} dateFormat="dd-MM-yyyy" />
          </div>
          <div>
            <label>To:</label>
            <DatePicker selected={endDate} onChange={date => setEndDate(date)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} dateFormat="dd-MM-yyyy" />
          </div>
          <button onClick={handleSubmit} disabled={isLoading} style={{ padding: '8px 16px' }}>
            {isLoading ? 'Loading...' : 'Submit'}
          </button>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Select Graph</h3>
        <select onChange={e => setSelectedGraph(e.target.value)} value={selectedGraph}>
          <optgroup label="Temperature">
            <option value="temperature_10">Temperature @ 10m</option>
            <option value="temperature_100">Temperature @ 100m</option>
            <option value="temperature_200">Temperature @ 200m</option>
            <option value="temperature_500">Temperature @ 500m</option>
            <option value="temperature_1000">Temperature @ 1000m</option>
          </optgroup>
          <optgroup label="Salinity">
            <option value="salinity_10">Salinity @ 10m</option>
            <option value="salinity_100">Salinity @ 100m</option>
            <option value="salinity_200">Salinity @ 200m</option>
            <option value="salinity_500">Salinity @ 500m</option>
            <option value="salinity_1000">Salinity @ 1000m</option>
          </optgroup>
        </select>
        
        {isLoading && <p>Fetching data from server...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        
        {!isLoading && !error && plotProfiles.length > 0 && (
          <Plot data={getPlotData()} layout={plotLayout} />
        )}
        
        {!isLoading && !error && plotProfiles.length === 0 && (
          <p>No data available for the selected options. Please adjust your dates or graph and click Submit.</p>
        )}
      </div>
      {/* Trajectory input moved to Sidebar */}
    </div>
  );
};

export default Dashboard;