import streamlit as st
import time

# Page config must be the first Streamlit command
st.set_page_config(
    page_title="LifeLine AI",
    page_icon="🚑",
    layout="wide",
    initial_sidebar_state="expanded"
)

from styles.theme import apply_theme
from components.header import render_header
from components.sidebar import render_sidebar
from components.logs import render_logs

def init_state():
    """Initialize session state variables."""
    if "logs" not in st.session_state:
        st.session_state.logs = []
    if "emergency_active" not in st.session_state:
        st.session_state.emergency_active = False

def run_simulation(start, dest):
    """Start simulation sequence by updating the state."""
    st.session_state.emergency_active = True
    st.session_state.logs = [f"🚑 Emergency Activated: {start} -> {dest}"]
    st.rerun()

def main():
    init_state()
    
    # 1. Apply customized anti-gravity futuristic theme safely
    apply_theme()
    
    # 2. Render sidebar and get inputs
    start_loc, dest_loc, start_btn = render_sidebar()
    
    # Process button click
    if start_btn:
        if start_loc and dest_loc:
            run_simulation(start_loc, dest_loc)
        else:
            st.sidebar.error("Error: Please provide both start location and destination.")
    
    # 3. Main content area rendering
    render_header()
    
    # Define columns for clean layout
    col1, _, col2 = st.columns([1.5, 0.1, 1])
    
    with col1:
        st.markdown("<h3>📍 Route Information & AI Decisions</h3>", unsafe_allow_html=True)
        
        with st.container(border=True):
            if st.session_state.emergency_active:
                st.info("Simulating route optimization protocols...")
                
                # Mock simulation loop advancing based on log count
                if len(st.session_state.logs) == 1:
                    time.sleep(1.5)
                    st.session_state.logs.append("📡 Alert propagated to network")
                    st.rerun()
                elif len(st.session_state.logs) == 2:
                    time.sleep(1.5)
                    st.session_state.logs.append("🚧 Obstacle detected on main highway")
                    st.rerun()
                elif len(st.session_state.logs) == 3:
                    time.sleep(1.5)
                    st.session_state.logs.append("🔁 Rerouting via sector 4")
                    st.rerun()
                else:
                    st.success("Target destination safely reached.")
            else:
                st.write("Awaiting emergency input configuration...")
                st.caption("Enter Start Location and Destination in the Mission Control sidebar to begin.")
            
    with col2:
        render_logs(st.session_state.logs)

if __name__ == "__main__":
    main()
