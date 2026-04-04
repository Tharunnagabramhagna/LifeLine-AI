import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import EventCard from './EventCard';
import AmbulanceStatus from './AmbulanceStatus';
import LifeLineMap from './LifeLineMap';
import Analytics from './Analytics';
import { apiRequest } from '../services/api';

const Dashboard = () => {
    const [events, setEvents] = useState([]);
    const [ambulances, setAmbulances] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    const SOCKET_URL = "http://localhost:5000";

    const fetchData = async () => {
        try {
            const [eventsData, ambulancesData, analyticsData] = await Promise.all([
                apiRequest('/events'),
                apiRequest('/ambulances'),
                apiRequest('/analytics')
            ]);

            setEvents(eventsData);
            setAmbulances(ambulancesData);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            if (error.message.includes('Session expired')) {
                setIsLoggedIn(false);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoggedIn) return;

        fetchData();

        const socket = io(SOCKET_URL);

        socket.on('new-emergency', (data) => {
            console.log("New Emergency Received:", data);
            fetchData();
        });

        socket.on('event-completed', (data) => {
            console.log("Event Completed:", data);
            fetchData();
        });

        socket.on('ambulance-assigned', (data) => {
            console.log("Ambulance Assigned:", data);
            fetchData();
        });

        return () => socket.disconnect();
    }, [isLoggedIn]);

    if (!isLoggedIn) {
        return (
            <div className="login-prompt">
                <h2>🔐 Dispatcher Login Required</h2>
                <p>Please login to access the LifeLine-AI dashboard.</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
                <style jsx>{`
                    .login-prompt {
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-family: 'Inter', sans-serif;
                        background: #f4f7f6;
                    }
                    button {
                        margin-top: 20px;
                        padding: 10px 20px;
                        background: #e74c3c;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    }
                `}</style>
            </div>
        );
    }

    if (loading) return <div className="loading">Initializing LifeLine AI Dashboard...</div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="logo">🚑 LifeLine AI Dashboard</div>
                <div className="status-dot">Live Feed</div>
            </header>

            <main className="dashboard-main">
                <section className="events-section">
                    <LifeLineMap 
                        incidentLoc={events.length > 0 ? mockIncidentLoc : null}
                        ambulanceLoc={ambulances.some(a => a.status === 'EN_ROUTE') ? mockAmbulanceLoc : null}
                    />

                    <Analytics data={analytics} />
                    
                    <div className="section-header">
                        <h2>🚨 Emergency Incidents</h2>
                        <span className="count-badge">{events.length} Active</span>
                    </div>
                    <div className="events-list scrollbar">
                        {events.length > 0 ? (
                            events.map(event => <EventCard key={event.id} event={event} onComplete={fetchData} />)
                        ) : (
                            <div className="empty-state">No active incidents at the moment.</div>
                        )}
                    </div>
                </section>

                <section className="fleet-section">
                    <AmbulanceStatus ambulances={ambulances} />
                </section>
            </main>

            <style jsx>{`
                .dashboard-container {
                    background: #f4f7f6;
                    min-height: 100vh;
                    font-family: 'Inter', sans-serif;
                    color: #2c3e50;
                }
                .dashboard-header {
                    background: #fff;
                    padding: 15px 30px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }
                .logo { font-size: 1.5rem; font-weight: 800; color: #e74c3c; }
                .status-dot {
                    background: #27ae60;
                    color: #fff;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .status-dot::before {
                    content: '';
                    width: 8px;
                    height: 8px;
                    background: #fff;
                    border-radius: 50%;
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }

                .dashboard-main {
                    display: grid;
                    grid-template-columns: 1fr 350px;
                    gap: 30px;
                    padding: 30px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .events-section {
                    background: #fff;
                    padding: 25px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    display: flex;
                    flex-direction: column;
                    height: calc(100vh - 160px);
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
                .count-badge {
                    background: #fdf2f2;
                    color: #e74c3c;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    font-weight: bold;
                }

                .events-list {
                    overflow-y: auto;
                    flex-grow: 1;
                    padding-right: 10px;
                }
                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #95a5a6;
                    font-style: italic;
                }

                .loading {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    color: #7f8c8d;
                }

                .scrollbar::-webkit-scrollbar { width: 6px; }
                .scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
                .scrollbar::-webkit-scrollbar-thumb { background: #dcdde1; border-radius: 10px; }
                .scrollbar::-webkit-scrollbar-thumb:hover { background: #bdc3c7; }

                @media (max-width: 900px) {
                    .dashboard-main { grid-template-columns: 1fr; }
                    .events-section { height: auto; }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
