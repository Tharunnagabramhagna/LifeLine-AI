import streamlit as st

def apply_theme():
    st.markdown("""
    <style>
    /* Anti-gravity futuristic theme */
    .stApp {
        background-color: #050a1f; 
        color: #e0e6ff;
    }
    
    /* Headers */
    h1, h2, h3 {
        color: #00ffff;
        text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }
    
    /* Neon accents */
    .stButton > button {
        background: linear-gradient(90deg, #00ffff, #8a2be2);
        color: black !important;
        font-weight: bold;
        border: none;
        border-radius: 20px;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
        transition: all 0.3s ease;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 25px rgba(138, 43, 226, 0.8);
    }
    
    /* Rounded inputs */
    .stTextInput > div > div > input {
        background-color: #111b3d;
        color: #00ffff;
        border: 1px solid #8a2be2;
        border-radius: 10px;
        box-shadow: 0 0 5px rgba(138, 43, 226, 0.3);
    }
    
    /* Custom containers */
    [data-testid="stVerticalBlockBorderWrapper"] {
        background-color: #0a1128;
        border: 1px solid #00ffff !important;
        border-radius: 15px;
        padding: 20px;
        box-shadow: inset 0 0 15px rgba(0, 255, 255, 0.1);
    }
    
    /* Log messages */
    .log-msg {
        font-family: 'Courier New', monospace;
        padding: 8px 12px;
        border-left: 3px solid #8a2be2;
        margin-bottom: 8px;
        background-color: #0c1538;
        color: #b0c4de;
        border-radius: 0 5px 5px 0;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    /* Sidebar styling */
    [data-testid="stSidebar"] {
        background-color: #030712;
        border-right: 1px solid #8a2be2;
    }
    
    </style>
    """, unsafe_allow_html=True)
