import streamlit as st

def render_sidebar():
    with st.sidebar:
        st.markdown("<h2>📡 Mission Control</h2>", unsafe_allow_html=True)
        st.divider()
        
        start_loc = st.text_input("Start Location", placeholder="E.g., City Center")
        destination = st.text_input("Destination", placeholder="E.g., Apollo Hospital")
        
        st.markdown("<br>", unsafe_allow_html=True)
        start_btn = st.button("🚀 Start Emergency", use_container_width=True)
        
        return start_loc, destination, start_btn
