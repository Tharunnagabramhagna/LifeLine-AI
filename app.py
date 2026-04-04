import streamlit as st
import pandas as pd
import numpy as np
import folium
from streamlit_folium import st_folium
import time
from geopy.distance import geodesic

# Page Configuration
st.set_page_config(
    page_title="LifeLine AI - Emergency Response System",
    page_icon="🚑",
    layout="wide"
)

# Custom CSS for modern look
st.markdown("""
    <style>
    .main {
        background-color: #f5f7f9;
    }
    .stButton>button {
        width: 100%;
        border-radius: 5px;
        height: 3em;
        background-color: #ff4b4b;
        color: white;
        font-weight: bold;
    }
    .stButton>button:hover {
        background-color: #ff3333;
        border-color: #ff3333;
    }
    .step-header {
        color: #1e3d59;
        border-bottom: 2px solid #ff4b4b;
        padding-bottom: 10px;
        margin-bottom: 20px;
    }
    .info-card {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        margin-bottom: 20px;
    }
    </style>
    """, unsafe_allow_html=True)

# Session State Initialization
if 'step' not in st.session_state:
    st.session_state.step = 1
if 'request_data' not in st.session_state:
    st.session_state.request_data = {}
if 'ambulance_data' not in st.session_state:
    st.session_state.ambulance_data = None
if 'hospital_notified' not in st.session_state:
    st.session_state.hospital_notified = False

# Mock Data
HOSPITALS = [
    {"name": "City General Hospital", "lat": 17.3850, "lon": 78.4867},
    {"name": "Apollo Emergency Center", "lat": 17.4250, "lon": 78.4100},
    {"name": "Global Health Institute", "lat": 17.4450, "lon": 78.3800}
]

AMBULANCES = [
    {"id": "AMB-001", "lat": 17.4000, "lon": 78.4500, "status": "Available"},
    {"id": "AMB-002", "lat": 17.4300, "lon": 78.4200, "status": "Available"},
    {"id": "AMB-003", "lat": 17.3700, "lon": 78.5000, "status": "Available"}
]

# Helper Functions
def get_nearest_ambulance(user_loc):
    min_dist = float('inf')
    nearest = None
    for amb in AMBULANCES:
        dist = geodesic(user_loc, (amb['lat'], amb['lon'])).km
        if dist < min_dist:
            min_dist = dist
            nearest = amb
    return nearest, min_dist

# --- APP FLOW ---

st.title("🚑 LifeLine AI")
st.subheader("Intelligent Emergency Response & Route Optimization")

# Progress Bar
steps = ["Request", "Assign", "Route", "Notify"]
st.progress((st.session_state.step - 1) / (len(steps) - 1) if st.session_state.step > 1 else 0)

# Step 1: Request Ambulance
if st.session_state.step == 1:
    st.markdown("<h2 class='step-header'>Step 1: Request Emergency Assistance</h2>", unsafe_allow_html=True)
    
    with st.container():
        st.markdown("<div class='info-card'>", unsafe_allow_html=True)
        col1, col2 = st.columns(2)
        
        with col1:
            name = st.text_input("Patient Name", placeholder="Enter patient name")
            emergency_type = st.selectbox("Emergency Type", 
                ["Cardiac Arrest", "Road Accident", "Stroke", "Respiratory Distress", "Other"])
        
        with col2:
            phone = st.text_input("Contact Number", placeholder="+91 XXXXX XXXXX")
            location_desc = st.text_area("Location Description", placeholder="Near Landmark, Building Name...")
        
        # Simulate GPS Location
        st.info("📍 Current Location detected via GPS: (17.4120, 78.4450)")
        user_lat, user_lon = 17.4120, 78.4450
        
        if st.button("Request Immediate Help"):
            if name and phone:
                st.session_state.request_data = {
                    "name": name,
                    "type": emergency_type,
                    "phone": phone,
                    "loc": (user_lat, user_lon),
                    "desc": location_desc
                }
                with st.spinner("Processing request and analyzing nearest resources..."):
                    time.sleep(2)
                st.session_state.step = 2
                st.rerun()
            else:
                st.error("Please fill in the required fields (Name and Phone).")
        st.markdown("</div>", unsafe_allow_html=True)

# Step 2: Assign Nearest Ambulance
elif st.session_state.step == 2:
    st.markdown("<h2 class='step-header'>Step 2: Ambulance Assignment</h2>", unsafe_allow_html=True)
    
    user_loc = st.session_state.request_data['loc']
    nearest_amb, distance = get_nearest_ambulance(user_loc)
    st.session_state.ambulance_data = nearest_amb
    
    st.success(f"✅ AI has identified the nearest ambulance!")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.markdown("<div class='info-card'>", unsafe_allow_html=True)
        st.write("### Ambulance Details")
        st.write(f"**ID:** {nearest_amb['id']}")
        st.write(f"**Current Distance:** {distance:.2f} km")
        st.write(f"**Estimated Arrival:** {int(distance * 3)} mins")
        st.write(f"**Status:** Dispatching...")
        st.markdown("</div>", unsafe_allow_html=True)
        
    with col2:
        st.markdown("<div class='info-card'>", unsafe_allow_html=True)
        st.write("### Patient Request Summary")
        st.write(f"**Patient:** {st.session_state.request_data['name']}")
        st.write(f"**Emergency:** {st.session_state.request_data['type']}")
        st.markdown("</div>", unsafe_allow_html=True)

    if st.button("Confirm & Start Route Optimization"):
        with st.spinner("Calculating optimal route avoiding traffic..."):
            time.sleep(1.5)
        st.session_state.step = 3
        st.rerun()

# Step 3: Route Optimization
elif st.session_state.step == 3:
    st.markdown("<h2 class='step-header'>Step 3: AI Route Optimization</h2>", unsafe_allow_html=True)
    
    user_loc = st.session_state.request_data['loc']
    amb_loc = (st.session_state.ambulance_data['lat'], st.session_state.ambulance_data['lon'])
    
    st.info("🤖 AI is dynamically rerouting to avoid heavy traffic on MG Road.")
    
    # Create Map
    m = folium.Map(location=user_loc, zoom_start=13)
    
    # Add Markers
    folium.Marker(user_loc, popup="Patient Location", icon=folium.Icon(color='red', icon='info-sign')).add_to(m)
    folium.Marker(amb_loc, popup="Ambulance", icon=folium.Icon(color='blue', icon='ambulance', prefix='fa')).add_to(m)
    
    # Draw simulated route
    route_coords = [amb_loc, (17.4100, 78.4300), (17.4150, 78.4400), user_loc]
    folium.PolyLine(route_coords, color="blue", weight=5, opacity=0.8).add_to(m)
    
    # Display Map
    st_folium(m, width=1000, height=400)
    
    col1, col2 = st.columns(2)
    with col1:
        st.metric("Optimal Distance", f"{geodesic(amb_loc, user_loc).km:.2f} km")
    with col2:
        st.metric("Estimated Time", f"{int(geodesic(amb_loc, user_loc).km * 2.5)} mins", "-2 mins (AI Savings)")

    if st.button("Proceed to Hospital Notification"):
        st.session_state.step = 4
        st.rerun()

# Step 4: Notify Hospital
elif st.session_state.step == 4:
    st.markdown("<h2 class='step-header'>Step 4: Hospital Pre-Notification</h2>", unsafe_allow_html=True)
    
    hospital = HOSPITALS[0] # Defaulting to nearest
    
    if not st.session_state.hospital_notified:
        with st.spinner(f"Sending patient vitals to {hospital['name']}..."):
            time.sleep(2)
            st.session_state.hospital_notified = True
            
    st.success(f"🏥 {hospital['name']} has been notified and is preparing for arrival!")
    
    st.markdown("<div class='info-card'>", unsafe_allow_html=True)
    st.write("### Digital Handover Report")
    st.write(f"**Patient Name:** {st.session_state.request_data['name']}")
    st.write(f"**Emergency Type:** {st.session_state.request_data['type']}")
    st.write(f"**Ambulance Assigned:** {st.session_state.ambulance_data['id']}")
    st.write(f"**Estimated Arrival at Hospital:** 12 minutes")
    st.write("**Vitals Shared:** HR: 98bpm, SpO2: 94%, BP: 130/85")
    st.markdown("</div>", unsafe_allow_html=True)
    
    if st.button("Finish Demo / Reset"):
        st.session_state.step = 1
        st.session_state.hospital_notified = False
        st.rerun()

# Sidebar Info
st.sidebar.image("https://img.icons8.com/color/96/000000/ambulance.png", width=100)
st.sidebar.title("LifeLine AI Status")
if st.session_state.step == 1:
    st.sidebar.info("Waiting for Request...")
elif st.session_state.step == 2:
    st.sidebar.warning("Assigning Resources...")
elif st.session_state.step == 3:
    st.sidebar.error("Emergency in Progress")
    st.sidebar.write(f"**Target:** {st.session_state.request_data['name']}")
    st.sidebar.write(f"**Ambulance:** {st.session_state.ambulance_data['id']}")
elif st.session_state.step == 4:
    st.sidebar.success("Hospital Notified")

st.sidebar.markdown("---")
st.sidebar.write("Developed by Tharun Satrasala")
st.sidebar.write("© 2026 LifeLine AI")
