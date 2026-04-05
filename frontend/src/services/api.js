// services/api.js

const BASE_URL = 'http://localhost:5000/api';

export const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
        throw new Error('Session expired, please login again');
    }
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API request failed');
    }
    
    return response.json();
};

export const getAmbulances = () => apiRequest('/ambulances');
export const getEvents = () => apiRequest('/events');

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
