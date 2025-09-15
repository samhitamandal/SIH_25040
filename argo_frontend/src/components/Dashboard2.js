import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import Plot from "react-plotly.js";
import "react-datepicker/dist/react-datepicker.css";
import "./Dashboard.css";

const colorPalette = {
  temperature: "#E55451",
  salinity: "#5D8AA8",
  pressure: "#6A5ACD",
};

function LineGraph({ variable, data, layout }) {
  return <Plot data={data} layout={layout} />;
}

function ContourPlot({ variable, layout }) {
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

const Dashboard = ({ data, onClose, latitude, longitude }) => {
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const [startDate, setStartDate] = useState(fiveYearsAgo);
  const [endDate, setEndDate] = useState(new Date());
  const [submittedStartDate, setSubmittedStartDate] = useState(fiveYearsAgo);
  const [submittedEndDate, setSubmittedEndDate] = useState(new Date());
  const [selectedGraph, setSelectedGraph] = useState("temperature");
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [plotType, setPlotType] = useState("line");

  const contourOptions = ["temperature", "salinity"];

  useEffect(() => {
    if (data && data.profiles && submittedStartDate && submittedEndDate) {
      const filtered = data.profiles.filter((profile) => {
        const profileDate = new Date(profile.date);
        return (
          profileDate >= submittedStartDate && profileDate <= submittedEndDate
        );
      });
      setFilteredProfiles(filtered);
    }
  }, [data, submittedStartDate, submittedEndDate]);

  const handleSubmit = () => {
    setSubmittedStartDate(startDate);
    setSubmittedEndDate(endDate);
  };

  const getPlotData = () => {
    const plotDates = filteredProfiles.map((p) => p.date);
    let plotYData = [];
    let name = "";
    let color = "";
    let yaxisTitle = "";

    switch (selectedGraph) {
      case "temperature":
        plotYData = filteredProfiles.map((p) => p.temperature);
        name = "Temperature (°C)";
        color = colorPalette.temperature;
        yaxisTitle = "Temperature (°C)";
        break;
      case "salinity":
        plotYData = filteredProfiles.map((p) => p.salinity);
        name = "Salinity (PSU)";
        color = colorPalette.salinity;
        yaxisTitle = "Salinity (PSU)";
        break;
      case "pressure":
        plotYData = filteredProfiles.map((p) => p.pressure);
        name = "Pressure (dbar)";
        color = colorPalette.pressure;
        yaxisTitle = "Pressure (dbar)";
        break;
      default:
        break;
    }

    return [
      {
        x: plotDates,
        y: plotYData,
        mode: "lines+markers",
        name: name,
        marker: { color: color, size: 6 },
        line: { color: color, width: 2 },
      },
    ];
  };

  const plotLayout = {
    title: {
      text: `Oceanographic Data (${
        selectedGraph.charAt(0).toUpperCase() + selectedGraph.slice(1)
      })`,
      font: {
        family: "Arial, sans-serif",
        size: 20,
        color: "#333",
      },
    },
    height: 500,
    width: 700,
    autosize: true,
    margin: { l: 60, r: 60, b: 60, t: 80 },
    xaxis: {
      title: plotType === "line" ? "Date" : "X Axis",
      showgrid: false,
      zeroline: false,
      linecolor: "#ccc",
    },
    yaxis: {
      title: plotType === "line" ? getPlotData()[0].name : "Y Axis",
      showgrid: true,
      gridcolor: "#e6e6e6",
      zeroline: true,
      rangemode: "tozero",
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

  if (!data) return null;

  // Only show pressure in select if plotType is line
  const graphOptions =
    plotType === "line"
      ? [
          { value: "temperature", label: "Temperature" },
          { value: "salinity", label: "Salinity" },
          { value: "pressure", label: "Pressure" },
        ]
      : [
          { value: "temperature", label: "Temperature" },
          { value: "salinity", label: "Salinity" },
        ];

  return (
    <div className="dashboard-container">
      <button className="dashboard-close-btn" onClick={onClose}>
        &times;
      </button>

      <h2>Oceanographic Dashboard</h2>

      {/* 1. Metadata Section */}
      <div className="dashboard-section">
        <h3>Metadata for Clicked Location</h3>
        <p>
          <strong>Latitude:</strong> {latitude.toFixed(4)}°
        </p>
        <p>
          <strong>Longitude:</strong> {longitude.toFixed(4)}°
        </p>
      </div>

      {/* 2. Date Range Selection */}
      <div className="dashboard-section date-range-selection">
        <h3>Select Date Range (5 Years Data)</h3>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div>
            <label>From:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="dd-MM-yyyy"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
            />
          </div>
          <div>
            <label>To:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="dd-MM-yyyy"
              showYearDropdown
              showMonthDropdown
              dropdownMode="select"
            />
          </div>
          <button
            onClick={handleSubmit}
            style={{
              padding: "8px 16px",
              borderRadius: "5px",
              border: "none",
              background: "#007bff",
              color: "white",
              cursor: "pointer",
            }}
          >
            Submit
          </button>
        </div>
      </div>

      {/* 3. Graph Selection & Plot */}
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
        {filteredProfiles.length > 0 ? (
          plotType === "line" ? (
            <LineGraph
              variable={selectedGraph}
              data={getPlotData()}
              layout={plotLayout}
            />
          ) : contourOptions.includes(selectedGraph) ? (
            <ContourPlot variable={selectedGraph} layout={plotLayout} />
          ) : (
            <div>Contour plot only available for Temperature and Salinity.</div>
          )
        ) : (
          <p>
            No data available for the selected date range. Please adjust your
            dates and click Submit.
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
