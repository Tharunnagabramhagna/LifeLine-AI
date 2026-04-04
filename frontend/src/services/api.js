const BASE_URL = 'http://localhost:5000/api';

/**
 * Reusable fetch helper that automatically adds JWT Authorization headers.
 */
export const apiRequest = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Optional: clear token and redirect on unauthorized
        // localStorage.removeItem('token');
        // window.location.href = '/login';
        throw new Error('Session expired, please login again');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API request failed');
    }

    return response.json();
};
