"""
LifeLine-AI — Ambulance Emergency Response System v2.2 (Fleet & Risk Integrated)
app.py | feature-ui branch

Section Map:
# PAGE CONFIG
# CSS BLOCK (Red/Black Theme)
# CONSTANTS
# SESSION STATE (init_state)
# HELPERS (ts, add_log, set_state, reset_all, haversine, select_nearest_ambulance, calculate_risk, recalculate_eta)
# RENDER HELPERS (render_stepper, render_route, render_logs, render_map, generate_pdf_report)
# SIMULATION ENGINE (run_mission)
# DATABASE HELPERS (init_db, save_case)
# ── LAYOUT ──
#   HEADER (Timer & Badge)
#   CRITICAL BANNER
#   STEPPER + PROGRESS
#   MAIN COLUMNS (LEFT/RIGHT)
#   MAP EXPANDER
#   MISSION SUMMARY
#   SIDEBAR (History & Fleet)
# BUTTON ACTIONS
# FOOTER
"""

import streamlit as st
import time
import random
import sqlite3
import pandas as pd
import pydeck as pdk
import io
import math
from datetime import datetime

# ── PAGE CONFIG ──
st.set_page_config(
    page_title="LifeLine-AI | Mission Control",
    page_icon="🚑",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── CSS BLOCK ──
st.markdown("""
<style>
    /* Global Red/Black Theme */
    .main { background-color: #0a0a0a; color: #ffffff; }
    .stApp { background-color: #0a0a0a; }
    
    .block-container { padding-top: 1.5rem; padding-bottom: 2rem; }
    
    /* Section label */
    .sec-label {
        font-size: 0.75rem; font-weight: 800;
        letter-spacing: 0.15em; text-transform: uppercase;
        color: #ff4b4b; border-bottom: 1px solid #333;
        padding-bottom: 0.4rem; margin-bottom: 0.8rem;
    }

    /* Status badge */
    .badge { display:inline-block; padding:4px 14px; border-radius:4px; font-size:0.75rem; font-weight:800; text-transform: uppercase; }
    .b-idle        { background:#333; color:#aaa; border: 1px solid #444; }
    .b-dispatching { background:#ff9800; color:#000; }
    .b-enroute     { background:#2196f3; color:#fff; }
    .b-arrived     { background:#9c27b0; color:#fff; }
    .b-completed   { background:#4caf50; color:#fff; }
    
    /* Risk Badges */
    .r-low      { background: #2e7d32; color: white; }
    .r-medium   { background: #ef6c00; color: white; }
    .r-critical { background: #c62828; color: white; animation: blink 1s infinite; }
    
    @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

    /* Stepper UI */
    .stepper { display: flex; justify-content: space-between; align-items: center; margin: 1.5rem 0; padding: 0 10%; }
    .step-node { width: 32px; height: 32px; border-radius: 50%; background: #222; border: 2px solid #444; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: #666; z-index: 2; }
    .step-active { border-color: #ff4b4b; color: #ff4b4b; box-shadow: 0 0 15px rgba(255,75,75,0.4); }
    .step-done { background: #ff4b4b; border-color: #ff4b4b; color: #000; }
    .step-line { flex-grow: 1; height: 2px; background: #333; margin: 0 -5px; z-index: 1; }
    .step-line-done { background: #ff4b4b; }

    /* Route timeline */
    .route-item { display: flex; gap: 15px; padding-bottom: 15px; position: relative; }
    .route-dot { width: 14px; height: 14px; border-radius: 50%; background: #333; margin-top: 4px; z-index: 2; border: 2px solid #444; }
    .dot-pending { background: #222; }
    .dot-active { background: #ff4b4b; border-color: #ff4b4b; box-shadow: 0 0 8px #ff4b4b; }
    .dot-done { background: #4caf50; border-color: #4caf50; }
    .route-text { font-size: 0.85rem; color: #777; }
    .active-step { color: #fff; font-weight: 700; }
    .done-step { color: #4caf50; }

    /* Log rows */
    .log-row { font-family:'Courier New',monospace; font-size:0.8rem; padding:4px 0; border-bottom: 1px solid #1a1a1a; }
    .log-ts   { color:#555; }
    .pri-low      { color:#4caf50; font-weight:600; }
    .pri-medium   { color:#ff9800; font-weight:600; }
    .pri-critical { color:#ff4b4b; font-weight:800; text-transform: uppercase; }
    
    /* Metrics */
    [data-testid="stMetricValue"] { color: #ff4b4b !important; font-family: monospace; }
    [data-testid="stMetricLabel"] { color: #aaa !important; font-size: 0.75rem !important; text-transform: uppercase; letter-spacing: 0.1em; }

    /* ── CIRCULAR SCANNER BOOT SPLASH ─────────────────────────────────────────── */ 
    @keyframes circleExpand { 
        0%   { transform: scale(0);    opacity: 0; } 
        60%  { transform: scale(1.06); opacity: 1; } 
        100% { transform: scale(1);    opacity: 1; } 
    } 
    @keyframes ambCross { 
        0%   { transform: translateX(-160px); } 
        100% { transform: translateX(160px);  } 
    } 
    @keyframes glowPop { 
        0%   { box-shadow: 0 0 40px 12px #ffffff14, 0 0 80px 24px #ffffff08, inset 0 0 30px #ffffff0a; } 
        50%  { box-shadow: 0 0 60px 20px #ffffff22, 0 0 100px 36px #ffffff12, inset 0 0 40px #ffffff14; } 
        100% { box-shadow: 0 0 40px 12px #ffffff14, 0 0 80px 24px #ffffff08, inset 0 0 30px #ffffff0a; } 
    } 
    @keyframes scanFadeIn { 
        0%   { opacity: 0; transform: translateY(6px); } 
        100% { opacity: 1; transform: translateY(0);   } 
    } 
    @keyframes scanFadeOut { 
        0%   { opacity: 1; } 
        100% { opacity: 0; } 
    } 
    @keyframes captionIn { 
        0%   { opacity: 0; } 
        100% { opacity: 1; } 
    } 
    .scan-wrapper { 
        position: fixed; top: 0; left: 0; 
        width: 100vw; height: 100vh; 
        background: #0a0a0a; 
        display: flex; flex-direction: column; 
        align-items: center; justify-content: center; 
        gap: 1.4rem; z-index: 9999; 
        animation: scanFadeOut 0.4s ease-in 2.8s forwards; 
    } 
    .scan-title { 
        font-size: 2.4rem; font-weight: 900; 
        letter-spacing: 0.18em; color: #ff4b4b; 
        opacity: 0; z-index: 1; 
        text-shadow: 0 0 8px #ff4b4b55; 
        animation: 
            scanFadeIn 0.5s ease-out 0.4s forwards, 
            glowPulse  2.4s ease-in-out 0.9s infinite; 
    } 
    .scan-circle { 
        position: absolute; width: 220px; 
        height: 220px; border-radius: 50%; 
        background: radial-gradient(circle, #ffffff18 0%, #ffffff06 60%, transparent 100%); 
        border: 1.5px solid #ffffff22; 
        box-shadow: 0 0 40px 12px #ffffff14, 0 0 80px 24px #ffffff08, inset 0 0 30px #ffffff0a; 
        overflow: hidden; display: flex; 
        align-items: center; justify-content: center; 
        z-index: 2; 
        animation: 
            circleExpand 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, 
            glowPop      0.6s ease-in-out 2.2s forwards; 
    } 
    .scan-amb { 
        font-size: 2.4rem; display: inline-block; 
        white-space: nowrap; opacity: 0; 
        animation: 
            ambCross   1.4s linear 0.8s forwards, 
            scanFadeIn 0.01s linear 0.8s forwards; 
    } 
    .scan-subtitle { 
        font-size: 0.75rem; color: #444; 
        letter-spacing: 0.12em; text-transform: uppercase; 
        opacity: 0; z-index: 1; 
        animation: scanFadeIn 0.5s ease-out 1.6s forwards; 
    } 
    .scan-caption { 
        font-family: 'Courier New', monospace; font-size: 0.65rem; 
        color: #ff4b4b; letter-spacing: 0.16em; 
        opacity: 0; z-index: 1; 
        animation: 
            captionIn 0.3s ease-out 2.0s forwards, 
            blink     1s ease-in-out 2.3s infinite; 
    }
    /* Existing basic animations used by scanner */
    @keyframes glowPulse { 
        0%, 100% { text-shadow: 0 0 6px #ff4b4b55, 0 2px 4px rgba(0,0,0,0.4); } 
        50%       { text-shadow: 0 0 24px #ff4b4bdd, 0 0 8px #ff4b4b88, 0 2px 4px rgba(0,0,0,0.4); } 
    } 
    @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
</style>
""", unsafe_allow_html=True)

# ── CONSTANTS ──
STATUS_MAP = {
    "IDLE": {"badge": "b-idle", "icon": "●"},
    "DISPATCHING": {"badge": "b-dispatching", "icon": "●"},
    "ENROUTE": {"badge": "b-enroute", "icon": "●"},
    "ARRIVED": {"badge": "b-arrived", "icon": "●"},
    "COMPLETED": {"badge": "b-completed", "icon": "●"}
}

# ── SESSION STATE ──
def init_state():
    """Initializes session state with integrated v2.2 keys."""
    defaults = {
        "state": "IDLE",
        "logs": [],
        "progress": 0,
        "eta": None,
        "distance": None,
        "speed": 0,
        "speed_delta": 0,
        "ambulance_id": None,
        "hospital": None,
        "route_steps": [],
        "current_step": -1,
        "mission_start": None,
        "patient_name": "",
        "patient_age": 0,
        "patient_condition": "Stable",
        "risk_level": "LOW",
        "vitals": {"pulse": 80, "bp_sys": 120, "bp_dia": 80, "spo2": 98},
        "fleet": [
            {"id": f"AMB-{101+i}", "lat": 16.50+random.uniform(-0.05, 0.05), "lon": 80.64+random.uniform(-0.05, 0.05), "status": "AVAILABLE"}
            for i in range(5)
        ],
        "route_coords": [],
        "amb_position": None,
        "current_critical_alert": None,
        "map_data": None,
        "mission_duration": 0,
        "intro_done": False
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

init_state()

# ── CIRCULAR SCANNER BOOT SPLASH ───────────────────────────────────────────── 
# Single-phase animation (3.2s total). 
# Circle expands → title reveals → ambulance crosses → fade out → dashboard. 
# st.rerun() fires once after animation completes. Never loops. 

if not st.session_state.get("intro_done", False): 

    splash_ph = st.empty() 

    with splash_ph.container(): 
        st.markdown(""" 
        <div class="scan-wrapper"> 
          <div class="scan-title">LifeLine AI</div> 
          <div class="scan-circle"> 
            <div class="scan-amb">🚑</div> 
          </div> 
          <div class="scan-subtitle">Smart Emergency Response System</div> 
          <div class="scan-caption">◼ SCANNING...</div> 
        </div> 
        """, unsafe_allow_html=True) 

    time.sleep(3.2)    # full animation window — CSS handles all motion 

    splash_ph.empty()                       # clear without flicker 
    st.session_state["intro_done"] = True   # guard — never runs again this session 
    st.rerun()                              # fires once — dashboard loads 

# ── HELPERS ──
def ts() -> str:
    return datetime.now().strftime("%H:%M:%S")

def add_log(priority: str, message: str):
    st.session_state.logs.append({"ts": ts(), "pri": priority, "msg": message})
    if priority == "CRITICAL":
        st.session_state.current_critical_alert = message

def set_state(new_state: str):
    st.session_state.state = new_state

def reset_all():
    # Save fleet status to preserve through session reset
    fleet_copy = st.session_state.fleet
    for k in list(st.session_state.keys()):
        del st.session_state[k]
    init_state()
    st.session_state.fleet = fleet_copy
    st.rerun()

def haversine(lat1, lon1, lat2, lon2):
    """Calculates distance in KM between two points."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1-a)))

def select_nearest_ambulance(inc_lat, inc_lon):
    """Finds nearest AVAILABLE unit and marks it BUSY."""
    available = [u for u in st.session_state.fleet if u["status"] == "AVAILABLE"]
    if not available: return None
    nearest = min(available, key=lambda u: haversine(inc_lat, inc_lon, u["lat"], u["lon"]))
    for u in st.session_state.fleet:
        if u["id"] == nearest["id"]: u["status"] = "BUSY"
    return nearest["id"]

def calculate_risk(pulse, bp, spo2):
    """Determines patient risk level based on vitals."""
    if pulse < 50 or pulse > 130 or bp < 80 or bp > 180 or spo2 < 90: return "CRITICAL"
    if pulse < 60 or pulse > 110 or bp < 90 or bp > 150 or spo2 < 95: return "MEDIUM"
    return "LOW"

def recalculate_eta(step_name):
    """Simulates dynamic traffic delays."""
    if st.session_state.eta is None: return
    r = random.random()
    if r < 0.30: # Delay
        delay = random.randint(1, 4)
        st.session_state.eta += delay
        add_log("MEDIUM", f"Traffic delay on {step_name}: ETA revised to {st.session_state.eta} min")
    elif r < 0.45: # Early clearance
        reduction = random.randint(1, 2)
        st.session_state.eta = max(1, st.session_state.eta - reduction)
        add_log("LOW", f"Signal clear: ETA revised to {st.session_state.eta} min")

def duration_since_start() -> str:
    if not st.session_state.mission_start: return "00:00"
    if st.session_state.state == "COMPLETED": seconds = st.session_state.mission_duration
    else: seconds = int((datetime.now() - datetime.fromisoformat(st.session_state.mission_start)).total_seconds())
    return f"{seconds // 60:02d}:{seconds % 60:02d}"

# ── RENDER HELPERS ──
def render_stepper():
    states = ["IDLE", "DISPATCHING", "ENROUTE", "ARRIVED", "COMPLETED"]
    curr_idx = states.index(st.session_state.state)
    html = '<div class="stepper">'
    for i, name in enumerate(states):
        cls = "step-done" if i < curr_idx else "step-active" if i == curr_idx else ""
        html += f'<div class="step-node {cls}">{i+1}</div>'
        if i < len(states) - 1:
            line_cls = "step-line-done" if i < curr_idx else ""
            html += f'<div class="step-line {line_cls}"></div>'
    html += '</div>'
    st.markdown(html, unsafe_allow_html=True)

def render_route(container):
    with container:
        if not st.session_state.route_steps: st.caption("Awaiting mission..."); return
        for i, step in enumerate(st.session_state.route_steps):
            dot_cls = "dot-done" if i < st.session_state.current_step else "dot-active" if i == st.session_state.current_step else "dot-pending"
            text_cls = "done-step" if i < st.session_state.current_step else "active-step" if i == st.session_state.current_step else ""
            st.markdown(f'<div class="route-item"><div class="route-dot {dot_cls}"></div><div class="route-text {text_cls}">{step}</div></div>', unsafe_allow_html=True)

def render_logs(container):
    with container:
        if not st.session_state.logs: st.caption("Log feed ready..."); return
        for log in reversed(st.session_state.logs[-20:]):
            pri_cls = f"pri-{log['pri'].lower()}"
            st.markdown(f'<div class="log-row"><span class="log-ts">[{log["ts"]}]</span>&nbsp;&nbsp;<span class="{pri_cls}">{log["pri"].ljust(8)}</span>&nbsp;&nbsp;{log["msg"]}</div>', unsafe_allow_html=True)

def render_map(ph: st.empty):
    """Animated Pydeck Map."""
    with ph.container():
        if not st.session_state.map_data: st.info("Map pending deployment."); return
        
        # Static Layers
        start_marker = pdk.Layer("ScatterplotLayer", st.session_state.map_data["points"].iloc[[0]], get_position="[lon, lat]", get_color="[255, 0, 0]", get_radius=150)
        end_marker = pdk.Layer("ScatterplotLayer", st.session_state.map_data["points"].iloc[[1]], get_position="[lon, lat]", get_color="[0, 255, 0]", get_radius=150)
        route_layer = pdk.Layer("LineLayer", st.session_state.map_data["route"], get_source_position="start", get_target_position="end", get_color=[100, 100, 100], get_width=3)
        
        # Dynamic Ambulance Layer
        amb_layer = None
        if st.session_state.amb_position:
            amb_df = pd.DataFrame([{"lon": st.session_state.amb_position[0], "lat": st.session_state.amb_position[1]}])
            amb_layer = pdk.Layer("ScatterplotLayer", amb_df, get_position="[lon, lat]", get_color="[33, 150, 243]", get_radius=250)
        
        layers = [route_layer, start_marker, end_marker]
        if amb_layer: layers.append(amb_layer)
        
        st.pydeck_chart(pdk.Deck(layers=layers, initial_view_state=pdk.ViewState(latitude=16.51, longitude=80.63, zoom=12, pitch=45)))

def generate_pdf_report() -> bytes:
    """Lazily generate PDF report via reportlab."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib import colors
    except ImportError:
        return b"ReportLab not installed. Please check requirements.txt"
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []
    
    elements.append(Paragraph(f"LifeLine-AI Mission Report - {ts()}", styles['Title']))
    elements.append(Spacer(1, 12))
    
    data = [
        ["Field", "Value"],
        ["Unit ID", st.session_state.get("ambulance_id", "N/A")],
        ["Patient", st.session_state.get("patient_name", "N/A")],
        ["Risk Level", st.session_state.get("risk_level", "LOW")],
        ["Distance", f"{st.session_state.get('distance', 0)} km"],
        ["Hospital", st.session_state.get("hospital", "N/A")],
        ["Pulse", f"{st.session_state.vitals['pulse']} bpm"],
        ["BP", f"{st.session_state.vitals['bp_sys']}/{st.session_state.vitals['bp_dia']} mmHg"],
        ["SpO2", f"{st.session_state.vitals['spo2']}%"]
    ]
    t = Table(data, colWidths=[100, 300])
    t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), colors.red), ('TEXTCOLOR',(0,0),(-1,0),colors.whitesmoke), ('GRID', (0,0), (-1,-1), 0.5, colors.grey)]))
    elements.append(t)
    
    elements.append(Spacer(1, 24))
    elements.append(Paragraph("Alert History Log", styles['Heading2']))
    log_data = [[l['ts'], l['pri'], l['msg'][:50]] for l in st.session_state.logs]
    log_t = Table(log_data, colWidths=[60, 60, 300])
    elements.append(log_t)
    
    doc.build(elements)
    return buffer.getvalue()

# ── SIMULATION ENGINE ──
def run_mission(start: str, dest: str):
    # 1. DISPATCHING
    set_state("DISPATCHING")
    st.session_state.mission_start = datetime.now().isoformat()
    st.session_state.risk_level = calculate_risk(st.session_state.vitals["pulse"], st.session_state.vitals["bp_sys"], st.session_state.vitals["spo2"])
    
    st.session_state.ambulance_id = select_nearest_ambulance(16.50, 80.65)
    add_log("MEDIUM", f"Emergency: {start} -> {dest}")
    if st.session_state.risk_level == "CRITICAL":
        add_log("CRITICAL", "Patient vitals CRITICAL — priority dispatch activated")
    yield; time.sleep(1.2)

    # 2. ENROUTE
    set_state("ENROUTE")
    st.session_state.distance = round(random.uniform(5.0, 12.0), 1)
    st.session_state.eta = int(st.session_state.distance * 1.8)
    st.session_state.route_steps = ["Base Exit", "Highway NH-16", "City Hub", "Medical Zone", "Arrival"]
    st.session_state.route_coords = [[80.65, 16.50], [80.64, 16.505], [80.63, 16.51], [80.625, 16.515], [80.62, 16.52]]
    st.session_state.map_data = {"points": pd.DataFrame([{"lat": 16.50, "lon": 80.65}, {"lat": 16.52, "lon": 80.62}]), "route": pd.DataFrame([{"start": st.session_state.route_coords[i], "end": st.session_state.route_coords[i+1]} for i in range(len(st.session_state.route_coords)-1)])}
    
    add_log("LOW", f"Unit {st.session_state.ambulance_id} enroute.")
    yield; time.sleep(1.0)

    for i, step in enumerate(st.session_state.route_steps):
        st.session_state.current_step = i
        st.session_state.amb_position = st.session_state.route_coords[i]
        st.session_state.speed = random.randint(60, 95)
        st.session_state.distance = max(0.1, round(st.session_state.distance - 2.0, 1))
        recalculate_eta(step)
        yield; time.sleep(1.5)

    # 3. ARRIVED
    set_state("ARRIVED")
    st.session_state.hospital = random.choice(["City Memorial", "Apollo", "AIIMS"])
    add_log("MEDIUM", f"Arrived at {st.session_state.hospital}.")
    yield; time.sleep(1.2)

    # 4. COMPLETED
    set_state("COMPLETED")
    st.session_state.mission_duration = int((datetime.now() - datetime.fromisoformat(st.session_state.mission_start)).total_seconds())
    for u in st.session_state.fleet:
        if u["id"] == st.session_state.ambulance_id: u["status"] = "AVAILABLE"
    save_case()
    add_log("LOW", "Mission successfully closed.")
    yield

# ── DATABASE HELPERS ──
def init_db():
    conn = sqlite3.connect("lifeline_cases.db")
    conn.cursor().execute('''CREATE TABLE IF NOT EXISTS cases (case_id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, start_location TEXT, destination TEXT, ambulance_id TEXT, hospital TEXT, eta_minutes INTEGER, distance_km REAL, duration_seconds INTEGER, patient_name TEXT, patient_age INTEGER, patient_condition TEXT, risk_level TEXT)''')
    conn.commit(); conn.close()

init_db()

def save_case():
    conn = sqlite3.connect("lifeline_cases.db"); c = conn.cursor()
    c.execute('''INSERT INTO cases (timestamp, start_location, destination, ambulance_id, hospital, eta_minutes, distance_km, duration_seconds, patient_name, patient_age, patient_condition, risk_level) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)''',
              (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), st.session_state.start_loc_input, st.session_state.dest_loc_input, st.session_state.ambulance_id, st.session_state.hospital, st.session_state.eta, st.session_state.distance, st.session_state.mission_duration, st.session_state.patient_name, st.session_state.patient_age, st.session_state.patient_condition, st.session_state.risk_level))
    conn.commit(); conn.close()

# ── REFRESH FUNCTIONS ──
def refresh_status(ph):
    with ph.container():
        if st.session_state.state == "IDLE": st.info("System Standby.")
        elif st.session_state.state == "COMPLETED": st.success("Mission Success.")
        else: st.warning(f"Active: {st.session_state.state}")

def refresh_metrics(ph):
    with ph.container():
        m1, m2, m3, m4 = st.columns(4)
        m1.metric("ETA", f"{st.session_state.eta}m" if st.session_state.eta else "—")
        m2.metric("Distance", f"{st.session_state.distance}km" if st.session_state.distance else "—")
        m3.metric("Speed", f"{st.session_state.speed}km/h" if st.session_state.speed else "—")
        risk_color = {"LOW": "r-low", "MEDIUM": "r-medium", "CRITICAL": "r-critical"}.get(st.session_state.risk_level, "b-idle")
        m4.markdown(f'<div class="badge {risk_color}">Risk: {st.session_state.risk_level}</div>', unsafe_allow_html=True)

# ── LAYOUT ──
h1, h2, h3 = st.columns([0.1, 0.65, 0.25])
h1.markdown("<h1>🚑</h1>", unsafe_allow_html=True)
h2.markdown("<h2>LifeLine-AI Control</h2>", unsafe_allow_html=True)
timer_ph = h3.empty()

def refresh_timer():
    with timer_ph:
        cfg = STATUS_MAP.get(st.session_state.state, STATUS_MAP["IDLE"])
        st.markdown(f'<div style="text-align:right"><span style="background:#222; padding:5px 10px; border-radius:4px; font-family:monospace;">{duration_since_start()}</span> <span class="badge {cfg["badge"]}">{st.session_state.state}</span></div>', unsafe_allow_html=True)

refresh_timer(); st.divider()
banner_ph = st.empty()
if st.session_state.current_critical_alert and st.session_state.state != "IDLE": banner_ph.error(st.session_state.current_critical_alert)
render_stepper(); st.progress({"IDLE":0,"DISPATCHING":25,"ENROUTE":50,"ARRIVED":75,"COMPLETED":100}.get(st.session_state.state,0)/100)

L, R = st.columns([0.42, 0.58], gap="large")
with L:
    st.markdown('<div class="sec-label">Dispatch</div>', unsafe_allow_html=True)
    is_active = st.session_state.state != "IDLE" and st.session_state.state != "COMPLETED"
    start_loc = st.text_input("Pickup", key="start_loc_input", disabled=is_active)
    dest_loc = st.text_input("Destination", key="dest_loc_input", disabled=is_active)
    
    if st.session_state.state == "IDLE":
        with st.expander("👤 Patient Vitals", expanded=True):
            st.session_state.patient_name = st.text_input("Name")
            st.session_state.patient_age = st.number_input("Age", 0, 120)
            v1, v2, v3 = st.columns(3)
            st.session_state.vitals["pulse"] = v1.number_input("Pulse", 0, 200, 80)
            st.session_state.vitals["bp_sys"] = v2.number_input("BP Sys", 0, 250, 120)
            st.session_state.vitals["spo2"] = v3.number_input("SpO2", 0, 100, 98)

    b1, b2 = st.columns(2)
    start_btn = b1.button("🚨 START", type="primary", use_container_width=True, disabled=is_active)
    reset_btn = b2.button("RESET", use_container_width=True)
    
    st.markdown('<div class="sec-label">Metrics</div>', unsafe_allow_html=True)
    status_ph = st.empty(); refresh_status(status_ph)
    metrics_ph = st.empty(); refresh_metrics(metrics_ph)
    route_ph = st.container(border=True); render_route(route_ph)

with R:
    st.markdown('<div class="sec-label">Alerts</div>', unsafe_allow_html=True)
    log_ph = st.container(height=400, border=True); render_logs(log_ph)
    if st.session_state.state == "COMPLETED":
        with st.container(border=True):
            st.markdown("### MISSION SUCCESS")
            st.download_button("📄 Download Mission Report (PDF)", generate_pdf_report(), "report.pdf", "application/pdf")

st.markdown("<br>", unsafe_allow_html=True)
map_ph = st.empty(); render_map(map_ph)

with st.sidebar:
    st.markdown('<div class="sec-label">Fleet Status</div>', unsafe_allow_html=True)
    st.table(pd.DataFrame(st.session_state.fleet))
    st.markdown('<div class="sec-label">History</div>', unsafe_allow_html=True)
    conn = sqlite3.connect("lifeline_cases.db"); df_h = pd.read_sql_query("SELECT timestamp, patient_name, hospital FROM cases ORDER BY case_id DESC LIMIT 10", conn); conn.close()
    if not df_h.empty: st.dataframe(df_h, hide_index=True)

if reset_btn: reset_all()
if start_btn:
    if not start_loc or not dest_loc: st.error("Missing locations.")
    else:
        for stage in run_mission(start_loc, dest_loc):
            refresh_timer(); refresh_status(status_ph); refresh_metrics(metrics_ph); render_route(route_ph); render_logs(log_ph); render_map(map_ph)
            time.sleep(0.05)
        st.rerun()
st.caption(f"LifeLine-AI v2.2 | {datetime.now().year}")
