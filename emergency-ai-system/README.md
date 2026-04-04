# AI-Based Emergency Ambulance System

A starter project for an AI-powered emergency vehicle navigation and management system.

## Features

- **Route Optimization**: Simulates multiple routes and selects the fastest path.
- **AI Decision Engine**: Logic-based system to handle traffic, obstacles, and signals.
- **Priority Signal Control**: Simulates requesting green lights for emergency vehicles.
- **Obstacle Detection**: Simulated detection of roadblocks or accidents.
- **Alert System**: Sends priority alerts and public notices.
- **Interactive UI**: Built with Streamlit for a user-friendly experience.

## Project Structure

- `app.py`: Main Streamlit application.
- `ai_engine.py`: AI logic for deciding actions based on environmental factors.
- `map_utils.py`: Route simulation and best route selection.
- `alert_system.py`: Functions for alerts and obstacle detection.
- `requirements.txt`: Project dependencies.

## How to Run

1. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Run the application:
   ```bash
   streamlit run app.py
   ```
