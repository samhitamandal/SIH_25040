import React, { useState } from "react";
import DatePicker from "react-datepicker";
import Plot from "react-plotly.js";
import "react-datepicker/dist/react-datepicker.css";
import "./Dashboard.css";

const colorPalette = {
  temperature: "#0077b6",
  salinity: "#5D8AA8",
  pressure: "#6A5ACD",
};

function DummyContourPlot({ variable, layout }) {
  // Dummy contour data for consistent size
  const dummyData = [
    {
      z: [
        [1, 2, 3, 4, 5],
        [2, 3, 4, 5, 6],
        [3, 4, 5, 6, 7],
        [4, 5, 6, 7, 8],
        [5, 6, 7, 8, 9],
      ],
      x: [1, 2, 3, 4, 5],
      y: [10, 20, 30, 40, 50],
      type: "contour",
      colorscale: variable === "temperature" ? "Hot" : "Blues",
      name: variable.charAt(0).toUpperCase() + variable.slice(1),
      showscale: true,
    },
  ];
  return <Plot data={dummyData} layout={layout} />;
}

const Dashboard = ({ onClose, latitude, longitude }) => {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const [startDate, setStartDate] = useState(fiveYearsAgo);
  const [endDate, setEndDate] = useState(new Date());
  const [selectedGraph, setSelectedGraph] = useState("temperature_10");
  const [plotProfiles, setPlotProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plotType, setPlotType] = useState("line"); // 'line' or 'contour'

  // Only show pressure for line plot
  const graphOptions =
    plotType === "line"
      ? [
          { value: "temperature_10", label: "Temperature @ 10m" },
          { value: "temperature_100", label: "Temperature @ 100m" },
          { value: "temperature_200", label: "Temperature @ 200m" },
          { value: "temperature_500", label: "Temperature @ 500m" },
          { value: "temperature_1000", label: "Temperature @ 1000m" },
          { value: "salinity_10", label: "Salinity @ 10m" },
          { value: "salinity_100", label: "Salinity @ 100m" },
          { value: "salinity_200", label: "Salinity @ 200m" },
          { value: "salinity_500", label: "Salinity @ 500m" },
          { value: "salinity_1000", label: "Salinity @ 1000m" },
          { value: "pressure_10", label: "Pressure @ 10m" },
          { value: "pressure_100", label: "Pressure @ 100m" },
          { value: "pressure_200", label: "Pressure @ 200m" },
          { value: "pressure_500", label: "Pressure @ 500m" },
          { value: "pressure_1000", label: "Pressure @ 1000m" },
        ]
      : [
          { value: "temperature_10", label: "Temperature @ 10m" },
          { value: "temperature_100", label: "Temperature @ 100m" },
          { value: "temperature_200", label: "Temperature @ 200m" },
          { value: "temperature_500", label: "Temperature @ 500m" },
          { value: "temperature_1000", label: "Temperature @ 1000m" },
          { value: "salinity_10", label: "Salinity @ 10m" },
          { value: "salinity_100", label: "Salinity @ 100m" },
          { value: "salinity_200", label: "Salinity @ 200m" },
          { value: "salinity_500", label: "Salinity @ 500m" },
          { value: "salinity_1000", label: "Salinity @ 1000m" },
        ];

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setPlotProfiles([]);

    const [variable, depth] = selectedGraph.split("_");
    const startDateString = startDate.toISOString().split("T")[0];
    const endDateString = endDate.toISOString().split("T")[0];

    const url = `http://127.0.0.1:8080/api/timeseries_at_depth/?lat=${latitude}&lng=${longitude}&start_date=${startDateString}&end_date=${endDateString}&depth=${depth}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch data");
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
    const [variable] = selectedGraph.split("_");
    let name, dataKey;
    if (variable === "temperature") {
      name = "Temperature (°C)";
      dataKey = "avg_temperature";
    } else if (variable === "salinity") {
      name = "Salinity (PSU)";
      dataKey = "avg_salinity";
    } else {
      name = "Pressure (dbar)";
      dataKey = "avg_pressure";
    }
    const plotDates = plotProfiles.map((p) => p.time);
    const plotYData = plotProfiles.map((p) => p[dataKey]);
    return [
      {
        x: plotDates,
        y: plotYData,
        mode: "lines+markers",
        name: name,
        marker: { color: colorPalette[variable] || "#6A5ACD", size: 6 },
        line: { color: colorPalette[variable] || "#6A5ACD", width: 2 },
      },
    ];
  };

  const plotLayout = {
    title: `Data for Grid Cell at ${latitude.toFixed(2)}°, ${longitude.toFixed(
      2
    )}°`,
    height: 500,
    width: 700,
    autosize: true,
    margin: { l: 60, r: 60, b: 60, t: 80 },
    xaxis: { title: plotType === "line" ? "Date" : "X Axis" },
    yaxis: {
      title: plotType === "line" ? getPlotData()[0]?.name || "" : "Y Axis",
    },
    paper_bgcolor: "#f5f5f5",
    plot_bgcolor: "#ffffff",
    hovermode: "x unified",
    hoverlabel: {
      bgcolor: "rgba(255, 255, 255, 0.8)",
      font: { color: "black" },
    },
    legend: {
      x: 0,
      y: 1.15,
      bgcolor: "rgba(255, 255, 255, 0)",
      bordercolor: "rgba(255, 255, 255, 0)",
    },
  };

  return (
    <div className="dashboard-container">
      <button className="dashboard-close-btn" onClick={onClose}>
        &times;
      </button>
      <h2>Oceanographic Dashboard</h2>

      <div className="dashboard-section">
        <h3>Metadata for Clicked Location</h3>
        <p>
          <strong>Latitude:</strong> {latitude.toFixed(4)}°
        </p>
        <p>
          <strong>Longitude:</strong> {longitude.toFixed(4)}°
        </p>
      </div>

      <div className="dashboard-section date-range-selection">
        <h3>Select Date Range</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label>From:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="dd-MM-yyyy"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label>To:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="dd-MM-yyyy"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              padding: "8px 16px",
              borderRadius: "5px",
              border: "none",
              background: "#0077b6",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              marginBottom: "2px",
            }}
          >
            {isLoading ? "Loading..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="dashboard-section">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h3 style={{ margin: 0 }}>
              {plotType === "line" ? "Line Plot" : "Depth-Time Plot"}
            </h3>
            <select
              onChange={(e) => setSelectedGraph(e.target.value)}
              value={selectedGraph}
              style={{ marginLeft: "10px" }}
            >
              {graphOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className="fancy-toggle-btn"
            onClick={() =>
              setPlotType(plotType === "line" ? "contour" : "line")
            }
            style={{
              padding: "8px 18px",
              borderRadius: "24px",
              border: "none",
              background: "#0077b6",
              color: "#fff",
              fontWeight: 600,
              fontSize: "1rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              transition: "background 0.3s",
              marginLeft: "10px",
            }}
          >
            {plotType === "line" ? "Show Depth-Time Plot" : "Show Line Plot"}
          </button>
        </div>
        {plotType === "line" ? (
          <>
            {isLoading && <p>Fetching data from server...</p>}
            {error && <p style={{ color: "red" }}>Error: {error}</p>}
            {!isLoading && !error && plotProfiles.length > 0 && (
              <Plot data={getPlotData()} layout={plotLayout} />
            )}
            {!isLoading && !error && plotProfiles.length === 0 && (
              <p>
                No data available for the selected options. Please adjust your
                dates or graph and click Submit.
              </p>
            )}
          </>
        ) : (
          <DummyContourPlot
            variable={selectedGraph.split("_")[0]}
            layout={plotLayout}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
