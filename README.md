# LifeLine AI: Intelligent Emergency Response System

**Status: Final Stable Version (Ready for Judging)**

LifeLine AI is a high-fidelity prototype designed to optimize ambulance routing and hospital coordination using AI. It features real-time traffic analysis, automated patient triage, and a professional digital handover system.

## 🚀 How to Run

### 1. Environment Setup
Open a **PowerShell** terminal in the project root and run:
```powershell
# 1. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 2. Install/Verify dependencies
pip install -r requirements.txt

```

### 2. Configuration (Secrets)
Create a file at `.streamlit/secrets.toml` and add your API keys:
```toml
GEMINI_API_KEY = "YOUR_GOOGLE_GEMINI_API_KEY"
ORS_API_KEY = "YOUR_OPENROUTESERVICE_API_KEY"
```

### 3. Launch the App
Use this single-line command for an immediate start:
```powershell
.\venv\Scripts\Activate.ps1; pip install -r requirements.txt; streamlit run app.py
```

## 🛠️ Core Technologies Stack
- **🖥️ UI Framework (Streamlit)**: Powers the interactive, responsive, and dynamic frontend without complex web boilerplate.
- **🤖 LLM (Google Gemini Pro)**: Powers the automated Patient Triage and SBAR medical summarization.
- **🛣️ Routing (OpenRouteService)**: Provides real-time, road-network navigation with dynamic traffic simulation.
- **🗄️ Database (SQLite)**: Ensures persistent management of hospital beds and diversion status across sessions.
- **🎤 Voice (Streamlit Mic Recorder)**: Enables hands-free dispatcher input for high-stress emergency environments.
- **📄 PDF (fpdf2)**: Generates professional, branded medical handover reports for hospital staff.

## 🎬 Demo Script (Pitch Guide)
1. **Reset**: Click **🔄 Full System Reset** in the sidebar to ensure a fresh state.
2. **Step 1 (Request)**: 
   - Fill in a **Patient Name**.
   - Use the **🎤 Speak** button to record an emergency description (e.g., "Patient having severe chest pain").
   - Click **🤖 AI Analyze** and watch the **AI Triage** automatically update the Priority and Emergency Type.
3. **Step 2 (Assign)**:
   - Observe how the AI selects the nearest specialized hospital with available beds.
   - Note the **Bed Count** decrease once you click **Confirm**.
4. **Step 3 (Route)**:
   - View the live **ORS Routing** map. 
   - Toggle **🚧 Simulate Road Block** to show dynamic rerouting.
   - Watch the **ETA Progress Bar** countdown.
5. **Step 4 (Notify)**:
   - Monitor the **Live Vitals Stream**.
   - Click **📄 Download Branded SBAR PDF** to show the professional handover report with branding and watermark.

---
Developed by **Tharun Satrasala** © 2026
