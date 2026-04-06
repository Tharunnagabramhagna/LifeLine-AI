// services/api.js

const BASE_URL = "http://localhost:5000/api";

export const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    
    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (err) {
        console.error("RAW RESPONSE:", text);
        throw new Error("Server returned HTML instead of JSON. Check API URL.");
    }
    
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('session-expired'));
        throw new Error(data.message || 'Session expired, please login again');
    }
    
    if (!response.ok) {
        throw new Error(data.error || data.message || 'API request failed');
    }
    
    return data;
};

export const getAmbulances = () => apiRequest('/ambulances');
export const getEvents = () => {
    const plan = localStorage.getItem('userPlan') || 'free';
    return apiRequest(`/events?plan=${plan}`);
};

// Maintain hospitals mock for the frontend maps since backend doesn't have it natively
export const getHospitals = async () => {
    return [
      { id: "HOSP-01", name: "Apollo Hospital",    location: { lat: 16.5180, lon: 80.6320 }, units: 12 },
      { id: "HOSP-02", name: "Ayush Hospital",     location: { lat: 16.4920, lon: 80.6580 }, units: 8 },
      { id: "HOSP-03", name: "Care Hospital",      location: { lat: 16.5380, lon: 80.6750 }, units: 15 },
      { id: "HOSP-04", name: "AIIMS Vijayawada",   location: { lat: 16.4750, lon: 80.6150 }, units: 5 },
      { id: "HOSP-05", name: "Medicover Hospital", location: { lat: 16.5280, lon: 80.6050 }, units: 10 },
      { id: "HOSP-06", name: "NRI Hospital",       location: { lat: 16.4880, lon: 80.6900 }, units: 7 },
    ];
};

export const createEmergency = async (data) => {
    return apiRequest('/emergency', {
        method: 'POST',
        body: JSON.stringify(data)
    });
};

export const simulateEmergency = async () => {
    return apiRequest('/simulate', {
        method: 'POST'
    });
};
