import streamlit as st
import time
import random
from ai_engine import decide_action
from map_utils import get_routes, get_best_route
from alert_system import send_alert, detect_obstacle, public_alert

# Page configuration
st.set_page_config(page_title="AI Emergency Ambulance System", layout="wide")

st.title("🚑 AI-Based Emergency Ambulance System")
st.markdown("---")

# Sidebar for inputs
with st.sidebar:
    st.header("Emergency Details")
    start_loc = st.text_input("Start Location", "Downtown Station")
    dest_loc = st.text_input("Destination", "General Hospital")
    
    st.subheader("Simulated Sensors")
    traffic_level = st.selectbox("Current Traffic Level", ["Low", "Medium", "High"])
    signal_state = st.selectbox("Current Traffic Signal", ["Green", "Yellow", "Red"])
    
    start_btn = st.button("🚨 Start Emergency")

# Main content area
col1, col2 = st.columns([2, 1])

if start_btn:
    with col1:
        st.info(f"Initiating emergency response from **{start_loc}** to **{dest_loc}**...")
        
        # 1. Get Routes
        routes = get_routes(start_loc, dest_loc)
        best_route = get_best_route(routes)
        
        st.subheader("📍 Route Analysis")
        st.write(f"Best Route: **{best_route['name']}**")
        st.write(f"Estimated Time: **{best_route['time']} minutes**")
        
        # 2. Obstacle Detection
        obstacle_found = detect_obstacle()
        
        # 3. AI Decision
        action, reason = decide_action(traffic_level, obstacle_found, signal_state)
        
        st.subheader("🧠 AI Decision Engine")
        if action == "REROUTE":
            st.error(f"Action: {action}")
        elif action == "TURN_GREEN":
            st.warning(f"Action: {action}")
        else:
            st.success(f"Action: {action}")
        st.write(f"Reason: *{reason}*")
        
    with col2:
        st.subheader("🔔 Alerts & Logs")
        with st.expander("System Logs", expanded=True):
            st.write(f"[{time.strftime('%H:%M:%S')}] Emergency started.")
            st.write(f"[{time.strftime('%H:%M:%S')}] Best route found: {best_route['name']}")
            
            if obstacle_found:
                st.write(f"[{time.strftime('%H:%M:%S')}] ⚠️ Obstacle detected!")
            
            st.write(f"[{time.strftime('%H:%M:%S')}] AI Decision: {action}")
            
            if action == "SEND_ALERT":
                st.write(f"[{time.strftime('%H:%M:%S')}] {send_alert()}")
            
            if action == "TURN_GREEN":
                st.write(f"[{time.strftime('%H:%M:%S')}] Requesting priority signal change...")
            
            st.write(f"[{time.strftime('%H:%M:%S')}] {public_alert()}")

else:
    with col1:
        st.write("Please enter the emergency details and click **Start Emergency** to begin simulation.")
        # Placeholder for map simulation
        st.image("https://via.placeholder.com/800x400.png?text=Simulation+Map+Placeholder", use_column_width=True)
    
    with col2:
        st.subheader("🔔 Alerts & Logs")
        st.write("Waiting for emergency signal...")

# Footer
st.markdown("---")
st.caption("AI-Powered Emergency Response System - Starter Template")
