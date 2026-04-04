import streamlit as st

def render_header():
    col1, col2 = st.columns([0.1, 0.9])
    
    with col1:
        st.markdown("<h1>🚑</h1>", unsafe_allow_html=True)
        
    with col2:
        st.markdown("<h1>LifeLine AI - Emergency System</h1>", unsafe_allow_html=True)
        st.markdown("<h3>Anti-Gravity Tactical Interface</h3>", unsafe_allow_html=True)
        
    st.divider()
