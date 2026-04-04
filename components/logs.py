import streamlit as st

def render_logs(logs):
    st.markdown("<h3>📋 Live Logs</h3>", unsafe_allow_html=True)
    
    with st.container(border=True):
        if not logs:
            st.markdown('<div class="log-msg" style="color: #666; border-color: #444;">System standby... Awaiting mission protocols.</div>', unsafe_allow_html=True)
        else:
            for log in reversed(logs):
                st.markdown(f'<div class="log-msg">{log}</div>', unsafe_allow_html=True)
