// Function to generate random float data for 5 years
const generateRandomFloatData = (startDate, endDate) => {
  const data = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split('T')[0];
    const temperature = (Math.random() * (25 - 5) + 5).toFixed(2); // 5 to 25 deg C
    const salinity = (Math.random() * (36 - 32) + 32).toFixed(2); // 32 to 36 PSU
    const pressure = (Math.random() * (2000 - 100) + 100).toFixed(0); // 100 to 2000 dbar

    data.push({
      date: dateString,
      temperature: parseFloat(temperature),
      salinity: parseFloat(salinity),
      pressure: parseFloat(pressure),
    });
    currentDate.setDate(currentDate.getDate() + 5); // Add data every 5 days
  }
  return data;
};

// Define a 5-year period for our mock data
const today = new Date();
const fiveYearsAgo = new Date();
fiveYearsAgo.setFullYear(today.getFullYear() - 5);

// Mock data for a single ARGO float, generated for any clicked location
const mockArgoFloat = {
  id: 'dynamic-float-001', 
  wmo: 9999999, 
  metadata: {
    latitude: null,
    longitude: null,
  },
  profiles: generateRandomFloatData(fiveYearsAgo, today),
};

export default mockArgoFloat;