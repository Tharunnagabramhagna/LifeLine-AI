import streamlit as st
import pandas as pd
import numpy as np
import folium
from streamlit_folium import st_folium
import time
from geopy.distance import geodesic
import json
import openrouteservice
from streamlit_mic_recorder import speech_to_text
import database_manager as db
import google.generativeai as genai
import os
from fpdf import FPDF
import datetime

# Initialize Database
db.init_db()

# ORS Client Configuration
try:
    ORS_API_KEY = st.secrets["ORS_API_KEY"]
    if ORS_API_KEY == "PASTE_YOUR_ORS_KEY_HERE" or not ORS_API_KEY:
        client = None
    else:
        client = openrouteservice.Client(key=ORS_API_KEY)
except Exception:
    client = None

# Gemini AI Configuration
try:
    GEMINI_API_KEY = st.secrets["GEMINI_API_KEY"]
    if GEMINI_API_KEY != "PASTE_YOUR_GEMINI_KEY_HERE" and GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
    else:
        GEMINI_API_KEY = None
except Exception:
    GEMINI_API_KEY = None

# Page Configuration
st.set_page_config(
    page_title="LifeLine AI Golden Standard",
    page_icon="🚑",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Dark Mode & Refined UI CSS
st.markdown("""
    <style>
    :root {
        --primary-color: #ff4b4b;
        --bg-color: #0e1117;
        --text-color: #fafafa;
    }
    .main { background-color: var(--bg-color); color: var(--text-color); }
    .stButton>button {
        width: 100%; border-radius: 8px; height: 3.5em;
        background-color: #ff4b4b; color: white; font-weight: 600;
        transition: all 0.3s ease; border: none;
    }
    .stButton>button:hover {
        background-color: #ff3333; transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255,75,75,0.4);
    }
    .step-header {
        color: #ff4b4b; border-left: 5px solid #ff4b4b;
        padding-left: 15px; margin-bottom: 25px; font-weight: 700;
    }
    .info-card {
        background-color: #161b22; padding: 25px; border-radius: 12px;
        border: 1px solid #30363d; margin-bottom: 20px; color: #fafafa;
    }
    .heartbeat-on { color: #23d160; font-weight: bold; }
    .heartbeat-off { color: #ff3860; font-weight: bold; }
    .sbar-container {
        background-color: #0d1117; border: 1px solid #ff4b4b;
        padding: 20px; border-radius: 10px; font-family: monospace;
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
if 'hospital_data' not in st.session_state:
    st.session_state.hospital_data = None
if 'hospital_notified' not in st.session_state:
    st.session_state.hospital_notified = False
if 'sbar_report' not in st.session_state:
    st.session_state.sbar_report = None

# Mock Ambulance Data
AMBULANCES = [
    {"id": "AMB-001", "lat": 17.4000, "lon": 78.4500, "status": "Available"},
    {"id": "AMB-002", "lat": 17.4300, "lon": 78.4200, "status": "Available"},
    {"id": "AMB-003", "lat": 17.3700, "lon": 78.5000, "status": "Available"}
]

EMERGENCY_MAP = {
    "Cardiac Arrest": "Cardiac",
    "Road Accident": "Trauma",
    "Stroke": "Trauma",
    "Respiratory Distress": "Trauma",
    "Other": "Trauma"
}

# --- SIDEBAR & DASHBOARD ---
st.sidebar.success('🚀 System Live & Demo Ready')

st.sidebar.info("""
**📋 Demo Protocol**
1. **AI Triage**: Analyze voice input.
2. **Bed Tracking**: Confirm hospital assignment.
3. **AI Routing**: Simulate road blocks.
""")

with st.sidebar.expander("📖 Demo Instructions"):
    st.markdown("""
    1. Click **'Full System Reset'** to start fresh.
    2. Use the **Mic** for Voice-to-Text Triage.
    3. Watch the **Dynamic Rerouting** in Step 3.
    4. Download the **Official SBAR PDF** in Step 4.
    """)

# System Reset in Sidebar
if st.sidebar.button("🔄 Full System Reset"):
    # Clear session state
    for key in list(st.session_state.keys()):
        del st.session_state[key]

    # Reset Database to defaults
    if os.path.exists("lifeline.db"):
        os.remove("lifeline.db")
    db.init_db()

    st.toast("System fully reset to factory defaults.", icon="🔄")
    time.sleep(1)
    st.rerun()

st.sidebar.image(
    "https://img.icons8.com/color/96/000000/ambulance.png",
    width=80)
st.sidebar.title("LifeLine AI Panel")

# Global Fleet Overview Map
st.sidebar.markdown("---")
st.sidebar.subheader("🌍 Global Fleet Overview")
fleet_map = folium.Map(
    location=[
        17.4000,
        78.4450],
    zoom_start=11,
    tiles="CartoDB dark_matter",
    zoom_control=False)
for amb in AMBULANCES:
    is_assigned = st.session_state.ambulance_data and st.session_state.ambulance_data[
        'id'] == amb['id'] and st.session_state.step > 1
    color = 'red' if is_assigned else 'green'
    folium.Marker([amb['lat'],
                   amb['lon']],
                  popup=f"{amb['id']} ({'Busy' if is_assigned else 'Available'})",
                  icon=folium.Icon(color=color,
                                   icon='ambulance',
                                   prefix='fa')).add_to(fleet_map)
with st.sidebar:
    st_folium(fleet_map, width=250, height=200, key="fleet_map_sidebar")

# System Heartbeat
st.sidebar.subheader("🌐 System Heartbeat")
ors_status = "ONLINE" if client else "OFFLINE"
db_status = "CONNECTED"
st.sidebar.markdown(
    f"ORS API: <span class='{
        'heartbeat-on' if client else 'heartbeat-off'}'>{ors_status}</span>",
    unsafe_allow_html=True)
st.sidebar.markdown(
    f"Hospital DB: <span class='heartbeat-on'>{db_status}</span>",
    unsafe_allow_html=True)

# Road Block Toggle
road_block = st.sidebar.toggle("🚧 Simulate Road Block", value=False)
if road_block:
    st.sidebar.warning("Road Block Simulation Active")

# Admin Console
st.sidebar.markdown("---")
st.sidebar.subheader("🏥 Hospital Admin Console")
all_hospitals = db.get_all_hospitals()
selected_hosp_name = st.sidebar.selectbox(
    "Select Hospital", [h['name'] for h in all_hospitals])
selected_hosp = next(
    h for h in all_hospitals if h['name'] == selected_hosp_name)
new_beds = st.sidebar.number_input(
    "Available Beds",
    0,
    selected_hosp['total_beds'],
    selected_hosp['available_beds'])
new_status = st.sidebar.selectbox(
    "Status", [
        "Active", "Diversion"], index=0 if selected_hosp['status'] == 'Active' else 1)
if st.sidebar.button("Update Info"):
    db.update_hospital_beds(selected_hosp['id'], new_beds)
    db.update_hospital_status(selected_hosp['id'], new_status)
    st.rerun()

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


def assign_best_hospital(user_loc, emergency_type):
    target_specialty = EMERGENCY_MAP.get(emergency_type, "Trauma")
    active_hospitals = db.get_active_hospitals()
    suitable = [h for h in active_hospitals if h['specialty']
                == target_specialty]
    if not suitable:
        suitable = active_hospitals
    if not suitable:
        return None, float('inf')
    min_dist = float('inf')
    best = None
    for hosp in suitable:
        dist = geodesic(user_loc, (hosp['lat'], hosp['lon'])).km
        if dist < min_dist:
            min_dist = dist
            best = hosp
    return best, min_dist


def get_ors_route(start, end, road_block=False):
    if not client:
        return None
    try:
        coords = [[start[1], start[0]], [end[1], end[0]]]
        params = {
            "coordinates": coords,
            "profile": 'driving-car',
            "format": 'geojson'}
        if road_block:
            box = [[[78.429, 17.409], [78.431, 17.409], [
                78.431, 17.411], [78.429, 17.411], [78.429, 17.409]]]
            params["options"] = {
                "avoid_polygons": {
                    "type": "MultiPolygon",
                    "coordinates": [box]}}
        return client.directions(**params)
    except Exception:
        return None


def generate_sbar(description, vitals):
    if not GEMINI_API_KEY:
        return "SBAR (Simulated Offline)"
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"Generate a medical SBAR report. Emergency: {
            st.session_state.request_data['type']}, Description: {description}, Vitals: HR {
            vitals['HR']}, SpO2 {
            vitals['SpO2']}."
        return model.generate_content(prompt).text
    except Exception:
        return "SBAR Generation Error."


def triage_ai(description):
    if not GEMINI_API_KEY:
        st.warning("AI Triage Unavailable - Switching to Manual Mode.")
        return {
            "Priority_Level": 3,
            "Recommended_Specialty": "Trauma",
            "Dispatcher_Note": "Offline"}
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = (f"Analyze emergency description and return JSON: "
                  f"{{Priority_Level: 1-5, Recommended_Specialty: Cardiac/Trauma/Pediatric, "
                  f"Dispatcher_Note: 1 sentence}}. Description: {description}")
        res = model.generate_content(prompt).text
        if "```json" in res:
            res = res.split("```json")[1].split("```")[0]
        result = json.loads(res)
        st.toast("✅ AI Triage Analysis Complete", icon="🤖")
        return result
    except Exception as e:
        st.error(f"AI Triage Error: {str(e)}")
        st.warning("Switching to Manual Mode.")
        return {
            "Priority_Level": 3,
            "Recommended_Specialty": "Trauma",
            "Dispatcher_Note": "Error"}


def create_sbar_pdf(report_text, patient_name):
    pdf = FPDF()
    pdf.add_page()

    # Branded Header
    pdf.set_fill_color(255, 75, 75)  # LifeLine Red
    pdf.rect(0, 0, 210, 40, 'F')

    pdf.set_font("Helvetica", 'B', 24)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 20, "LifeLine AI - Emergency Handover", ln=True, align='C')

    # Confidential Watermark/Header
    pdf.set_font("Helvetica", 'B', 10)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 5, "*** CONFIDENTIAL MEDICAL RECORD ***", ln=True, align='C')

    pdf.ln(15)

    # Metadata
    pdf.set_font("Helvetica", 'I', 10)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(
        0,
        10,
        f"Generated: {
            datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        ln=True,
        align='R')

    pdf.ln(5)

    # Patient Info Section
    pdf.set_font("Helvetica", 'B', 14)
    pdf.set_text_color(255, 75, 75)
    pdf.cell(0, 10, f"PATIENT: {patient_name.upper()}", ln=True)
    pdf.set_font("Helvetica", 'B', 12)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(
        0,
        10,
        f"EMERGENCY TYPE: {
            st.session_state.request_data['type']}",
        ln=True)

    pdf.ln(5)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(10)

    # Report Body
    pdf.set_font("Helvetica", '', 12)
    pdf.multi_cell(0, 10, report_text)

    # Footer
    pdf.set_y(-30)
    pdf.set_font("Helvetica", 'I', 8)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(
        0,
        10,
        "This document is an AI-generated emergency handover report intended for medical professionals only.",
        align='C')

    return bytes(pdf.output())


# --- APP FLOW ---
st.title("🚑 LifeLine AI: Golden Standard")

steps = ["Request", "Assign", "Route", "Notify"]
st.progress((st.session_state.step - 1) / (len(steps) - 1))

# Step 1: Request
if st.session_state.step == 1:
    st.markdown(
        "<h2 class='step-header'>Step 1: Emergency Dispatch</h2>",
        unsafe_allow_html=True)
    with st.container():
        st.markdown("<div class='info-card'>", unsafe_allow_html=True)
        col1, col2 = st.columns(2)
        etype_list = list(EMERGENCY_MAP.keys())
        default_idx = 0
        if 'triage_result' in st.session_state:
            target = {
                "Cardiac": "Cardiac Arrest",
                "Trauma": "Road Accident",
                "Pediatric": "Other"}.get(
                st.session_state.triage_result.get('Recommended_Specialty'),
                "Other")
            if target in etype_list:
                default_idx = etype_list.index(target)
        with col1:
            name = st.text_input("Patient Name")
            etype = st.selectbox(
                "Emergency Type",
                etype_list,
                index=default_idx)
            if 'triage_result' in st.session_state:
                st.info(
                    f"AI: Priority {
                        st.session_state.triage_result['Priority_Level']} | {
                        st.session_state.triage_result['Dispatcher_Note']}")
        with col2:
            phone = st.text_input("Phone")
            voice_text = speech_to_text(
                language='en',
                start_prompt="🎤 Speak",
                stop_prompt="🛑 Stop")
            location_desc = st.text_area(
                "Details", value=voice_text if voice_text else "")
            if st.button("🤖 AI Analyze"):
                if location_desc:
                    with st.spinner("AI analyzing emergency priority..."):
                        st.session_state.triage_result = triage_ai(
                            location_desc)
                        st.rerun()
                else:
                    st.warning("Please provide description.")
        if st.button("Dispatch"):
            if name and phone:
                st.session_state.request_data = {
                    "name": name, "type": etype, "phone": phone, "loc": (
                        17.4120, 78.4450), "desc": location_desc}
                st.session_state.step = 2
                st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

# Step 2: Assign
elif st.session_state.step == 2:
    st.markdown(
        "<h2 class='step-header'>Step 2: Resource Assignment</h2>",
        unsafe_allow_html=True)
    user_loc = st.session_state.request_data['loc']
    amb, amb_dist = get_nearest_ambulance(user_loc)
    hosp, hosp_dist = assign_best_hospital(
        user_loc, st.session_state.request_data['type'])
    if amb and hosp:
        st.session_state.ambulance_data = amb
        st.session_state.hospital_data = hosp
        col1, col2 = st.columns(2)
        with col1:
            st.markdown(
                f"<div class='info-card'>🚑 {
                    amb['id']}<br>{
                    amb_dist:.2f} km</div>",
                unsafe_allow_html=True)
        with col2:
            h_color = "#23d160" if hosp['available_beds'] > 5 else "#ff3860"
            st.markdown(
                f"<div class='info-card'>🏥 {
                    hosp['name']}<br><span style='color: {h_color}'>Beds: {
                    hosp['available_beds']}</span></div>",
                unsafe_allow_html=True)
        if st.button("Confirm"):
            db.consume_bed(hosp['id'])
            st.session_state.step = 3
            st.rerun()
    else:
        st.toast(
            "🚨 Warning: Specialized center at capacity. Rerouting...",
            icon="🚨")
        st.error("No Resources Available.")
    if st.button("Back"):
        st.session_state.step = 1
        st.rerun()

# Step 3: Route
elif st.session_state.step == 3:
    st.markdown(
        "<h2 class='step-header'>Step 3: Navigation & ETA</h2>",
        unsafe_allow_html=True)
    user_loc = st.session_state.request_data['loc']
    amb_loc = (
        st.session_state.ambulance_data['lat'],
        st.session_state.ambulance_data['lon'])
    route = get_ors_route(amb_loc, user_loc, road_block=road_block)
    initial_eta = 15
    if route and 'features' in route:
        initial_eta = int(
            route['features'][0]['properties']['summary']['duration'] / 60)
    eta_container = st.empty()
    progress_bar = st.progress(0)
    m = folium.Map(
        location=user_loc,
        zoom_start=13,
        tiles="CartoDB dark_matter")
    folium.Marker(user_loc, icon=folium.Icon(color='red')).add_to(m)
    folium.Marker(
        amb_loc,
        icon=folium.Icon(
            color='blue',
            icon='ambulance',
            prefix='fa')).add_to(m)
    if road_block:
        folium.Circle([17.4100, 78.4300], radius=150,
                      color='red', fill=True).add_to(m)
    if route:
        folium.GeoJson(
            route,
            style_function=lambda x: {
                'color': '#ff4b4b',
                'weight': 5}).add_to(m)
    st_folium(m, width=1000, height=400)
    if st.button("Notify"):
        st.session_state.step = 4
        st.rerun()
    for i in range(initial_eta, 0, -1):
        eta_container.metric("⏱️ ETA", f"{i} mins")
        progress_bar.progress((initial_eta - i) / initial_eta)
        time.sleep(1)
    progress_bar.progress(1.0)

# Step 4: Notify
elif st.session_state.step == 4:
    st.markdown(
        "<h2 class='step-header'>Step 4: Handover & SBAR</h2>",
        unsafe_allow_html=True)
    chart_placeholder = st.empty()
    v_data = pd.DataFrame(columns=['HR', 'SpO2'])
    if st.session_state.sbar_report:
        st.markdown(
            f"<div class='sbar-container'>{
                st.session_state.sbar_report}</div>",
            unsafe_allow_html=True)
        pdf = create_sbar_pdf(
            st.session_state.sbar_report,
            st.session_state.request_data['name'])
        timestamp = datetime.datetime.now().strftime("%Y%m%d")
        clean_name = "".join(
            x for x in st.session_state.request_data['name'] if x.isalnum())
        st.download_button(
            label="📄 Download Branded SBAR PDF",
            data=pdf,
            file_name=f"Report_{clean_name}_{timestamp}.pdf",
            mime="application/pdf"
        )
    for _ in range(10):
        latest = {
            'HR': np.random.randint(
                90, 110), 'SpO2': np.random.randint(
                92, 99)}
        v_data = pd.concat([v_data, pd.DataFrame([latest])], ignore_index=True)
        with chart_placeholder:
            st.line_chart(v_data)
        time.sleep(0.3)
    if not st.session_state.sbar_report:
        st.session_state.sbar_report = generate_sbar(
            st.session_state.request_data['desc'], {
                'HR': 98, 'SpO2': 95})
        st.rerun()
    if st.button("Finish & Release"):
        db.release_bed(st.session_state.hospital_data['id'])
        st.session_state.step = 1
        st.session_state.sbar_report = None
        st.rerun()

st.sidebar.markdown("---")
st.sidebar.markdown(
    "[GitHub Repository](https://github.com/Tharunnagabramhagna/LifeLine-AI)")
st.sidebar.write("Developed by Tharun Satrasala")
