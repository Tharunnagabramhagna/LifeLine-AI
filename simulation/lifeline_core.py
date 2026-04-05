import random
import time
import threading
import queue
import heapq
import logging
from enum import IntEnum, Enum, auto
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Set, Tuple, Any, Optional

# --- LOGGING SETUP ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.FileHandler("lifeline.log"), logging.StreamHandler()]
)
logger = logging.getLogger("LifeLine-AI")

# --- CONFIGURATION ---
CONFIG = {
    "ROUTE": ["Hospital", "MainSt", "ParkAve", "OakRd", "ElmSt", "Destination"],
    "SIMULATION_DELAY": 1.0,
    "SMS_ENABLED": False,
    "TTS_ENABLED": False,
    "TWILIO_ACCOUNT_SID": "your_sid",
    "TWILIO_AUTH_TOKEN": "your_token",
    "TWILIO_FROM_NUMBER": "+1234567890",
    "TWILIO_TO_NUMBER": "+0987654321",
    "TTS_ENGINE": "gTTS",
    "QUEUE_MAXSIZE": 100,
    "WORKER_THREADS": 2,
    "SPEED_KMH": 40.0
}

# Updated CITY_GRAPH with distance (km) and typical speed (km/h)
CITY_GRAPH = {
    "Hospital": {"MainSt": {"dist": 2.5, "speed": 40}, "ParkAve": {"dist": 4.0, "speed": 50}},
    "MainSt": {"Hospital": {"dist": 2.5, "speed": 40}, "ParkAve": {"dist": 1.5, "speed": 30}, "OakRd": {"dist": 3.0, "speed": 45}},
    "ParkAve": {"Hospital": {"dist": 4.0, "speed": 50}, "MainSt": {"dist": 1.5, "speed": 30}, "ElmSt": {"dist": 2.0, "speed": 35}},
    "OakRd": {"MainSt": {"dist": 3.0, "speed": 45}, "ElmSt": {"dist": 1.2, "speed": 25}, "Destination": {"dist": 2.8, "speed": 40}},
    "ElmSt": {"ParkAve": {"dist": 2.0, "speed": 35}, "OakRd": {"dist": 1.2, "speed": 25}, "Destination": {"dist": 3.5, "speed": 45}},
    "Destination": {"OakRd": {"dist": 2.8, "speed": 40}, "ElmSt": {"dist": 3.5, "speed": 45}}
}

NODE_COORDS = {
    "Hospital": (0, 10),
    "MainSt": (2, 7),
    "ParkAve": (5, 8),
    "OakRd": (4, 4),
    "ElmSt": (7, 5),
    "Destination": (10, 0)
}

# --- EVENT SYSTEM ---
class Priority(IntEnum):
    CRITICAL = 1
    HIGH = 2
    NORMAL = 3

class EventType(Enum):
    APPROACHING = ("Ambulance Approaching", Priority.NORMAL)
    OBSTACLE = ("Obstacle Detected", Priority.HIGH)
    BLOCKAGE = ("Road Blockage", Priority.CRITICAL)
    ARRIVED = ("Destination Reached", Priority.NORMAL)
    DISPATCHED = ("Ambulance Dispatched", Priority.HIGH)
    EMERGENCY = ("New Emergency Reported", Priority.CRITICAL)
    REDISPATCHED = ("Ambulance Re-dispatched", Priority.CRITICAL)

    def __init__(self, label, priority):
        self.label = label
        self.priority = priority

@dataclass(order=True)
class AlertEvent:
    priority: Priority = field(init=False)
    event_type: EventType
    location: str
    message: str
    timestamp: datetime = field(default_factory=datetime.now, compare=False)
    metadata: Dict[str, Any] = field(default_factory=dict, compare=False)

    def __post_init__(self):
        self.priority = self.event_type.priority

    def to_dict(self):
        return {
            "type": self.event_type.name,
            "label": self.event_type.label,
            "priority": self.priority.name,
            "location": self.location,
            "message": self.message,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata
        }

# --- AMBULANCE MODEL ---
@dataclass
class Ambulance:
    id: str
    current_location: str
    route: List[str] = field(default_factory=list)
    active: bool = False
    route_index: int = 0
    current_priority: Priority = Priority.NORMAL
    stats: Dict[str, int] = field(default_factory=lambda: {"obstacles": 0, "blockages": 0, "redispatches": 0})

    def to_dict(self):
        return {
            "id": self.id,
            "current_location": self.current_location,
            "route": self.route,
            "active": self.active,
            "route_index": self.route_index,
            "current_priority": self.current_priority.name,
            "stats": self.stats
        }

# --- EVENT DISPATCHER ---
class EventDispatcher:
    def __init__(self):
        self._lock = threading.RLock()
        self._queue = queue.PriorityQueue(maxsize=CONFIG["QUEUE_MAXSIZE"])
        self._subscribers: Dict[EventType, List[Any]] = {}
        self._workers = []
        self._stop_event = threading.Event()

    def register(self, event_type: EventType, handler):
        with self._lock:
            if event_type not in self._subscribers:
                self._subscribers[event_type] = []
            if handler not in self._subscribers[event_type]:
                self._subscribers[event_type].append(handler)

    def unregister(self, event_type: EventType, handler):
        with self._lock:
            if event_type in self._subscribers and handler in self._subscribers[event_type]:
                self._subscribers[event_type].remove(handler)

    def fire(self, event: AlertEvent):
        try:
            self._queue.put_nowait(event)
        except queue.Full:
            logger.warning(f"Event queue full. Dropped event: {event.message}")

    def _worker_loop(self):
        while not self._stop_event.is_set():
            try:
                event = self._queue.get(timeout=0.5)
                if event is None: break
                with self._lock:
                    handlers = list(self._subscribers.get(event.event_type, []))
                for handler in handlers:
                    try:
                        handler(event)
                    except Exception as e:
                        logger.error(f"Handler failed: {e}")
                self._queue.task_done()
            except queue.Empty:
                continue

    def start(self):
        for _ in range(CONFIG["WORKER_THREADS"]):
            t = threading.Thread(target=self._worker_loop, daemon=True)
            t.start()
            self._workers.append(t)

    def stop(self):
        self._stop_event.set()
        for _ in self._workers:
            self._queue.put(None)
        for t in self._workers:
            t.join()

# --- ALERT CHANNELS ---
class AlertChannel:
    @property
    def name(self): raise NotImplementedError
    def is_available(self): return True
    def send(self, event: AlertEvent): raise NotImplementedError

class ConsoleChannel(AlertChannel):
    @property
    def name(self): return "Console"
    def send(self, event: AlertEvent):
        icons = {Priority.CRITICAL: "🚨", Priority.HIGH: "⚠️", Priority.NORMAL: "ℹ️"}
        logger.info(f"{icons.get(event.priority)} [{event.priority.name}] {event.location}: {event.message}")

class SMSChannel(AlertChannel):
    @property
    def name(self): return "SMS"
    def __init__(self):
        self._client = None
        if CONFIG["SMS_ENABLED"]:
            try:
                from twilio.rest import Client
                self._client = Client(CONFIG["TWILIO_ACCOUNT_SID"], CONFIG["TWILIO_AUTH_TOKEN"])
            except ImportError: pass
    def is_available(self): return self._client is not None and CONFIG["SMS_ENABLED"]
    def send(self, event: AlertEvent):
        if self.is_available():
            try:
                self._client.messages.create(
                    body=f"LifeLine-AI [{event.priority.name}]: {event.message} at {event.location}",
                    from_=CONFIG["TWILIO_FROM_NUMBER"], to=CONFIG["TWILIO_TO_NUMBER"]
                )
            except Exception as e: logger.error(f"SMS Error: {e}")

class TTSChannel(AlertChannel):
    @property
    def name(self): return "TTS"
    def __init__(self):
        self._engine_type = CONFIG["TTS_ENGINE"]
        self._available = False
        if CONFIG["TTS_ENABLED"]:
            if self._engine_type == "pyttsx3":
                try:
                    import pyttsx3
                    self._engine = pyttsx3.init()
                    self._available = True
                except ImportError: pass
            elif self._engine_type == "gTTS":
                try:
                    import gtts
                    self._available = True
                except ImportError: pass
    def is_available(self): return self._available and CONFIG["TTS_ENABLED"]
    def send(self, event: AlertEvent):
        if not self.is_available(): return
        logger.info(f"TTS Speaking: {event.message}")

class AlertManager:
    def __init__(self, dispatcher: EventDispatcher):
        self.channels: List[AlertChannel] = [ConsoleChannel(), SMSChannel(), TTSChannel()]
        self.dispatcher = dispatcher
        for et in EventType:
            self.dispatcher.register(et, self.handle_event)
    def register_channel(self, channel: AlertChannel):
        self.channels.append(channel)
    def handle_event(self, event: AlertEvent):
        for channel in self.channels:
            if channel.is_available():
                channel.send(event)

# --- ROUTER (ETA-BASED DIJKSTRA) ---
class Router:
    def __init__(self, graph: Dict[str, Dict[str, Dict[str, float]]]):
        self.graph = graph

    def get_path_and_eta(self, start: str, goal: str, blocked_nodes: Optional[Set[str]] = None) -> Tuple[List[str], float]:
        """Returns the shortest path (by time) and the total ETA in minutes."""
        blocked = blocked_nodes or set()
        if start in blocked or goal in blocked:
            raise ValueError("Start or Goal is blocked")

        # distances stores time in minutes
        times = {node: float('inf') for node in self.graph}
        times[start] = 0
        pq = [(0, start, [start])]
        
        while pq:
            curr_time, curr_node, path = heapq.heappop(pq)
            if curr_time > times[curr_node]: continue
            if curr_node == goal: return path, curr_time

            for neighbor, data in self.graph[curr_node].items():
                if neighbor in blocked: continue
                # time = (distance / speed) * 60 minutes
                travel_time = (data["dist"] / data["speed"]) * 60
                new_time = curr_time + travel_time
                if new_time < times[neighbor]:
                    times[neighbor] = new_time
                    heapq.heappush(pq, (new_time, neighbor, path + [neighbor]))
        
        raise ValueError(f"No path from {start} to {goal}")

# --- SIMULATION ENGINE ---
class SimulationEngine:
    def __init__(self, dispatcher: EventDispatcher):
        self.dispatcher = dispatcher
        self.router = Router(CITY_GRAPH)
        self.blocked: Set[str] = set()
        self.ambulances: List[Ambulance] = []
        self.emergency_queue = [] # Stores (priority, location)
        self.event_log = []
        self.is_running = False
        self.stats = {"emergencies": 0, "redispatches": 0}

    def add_ambulance(self, id: str, start_location: str):
        amb = Ambulance(id=id, current_location=start_location)
        self.ambulances.append(amb)
        return amb

    def find_best_ambulance(self, emergency_location: str, emergency_priority: Priority) -> Tuple[Optional[Ambulance], float]:
        """Finds the best ambulance based on minimum ETA, considering priority for redispatch."""
        best_amb = None
        min_eta = float('inf')

        for amb in self.ambulances:
            try:
                _, eta = self.router.get_path_and_eta(amb.current_location, emergency_location, self.blocked)
                
                # Case 1: Ambulance is idle
                if not amb.active:
                    if eta < min_eta:
                        min_eta = eta
                        best_amb = amb
                
                # Case 2: Ambulance is active but can be re-dispatched (Dynamic Redispatch)
                # Logic: If current task priority is lower (higher number) than new task
                elif amb.current_priority > emergency_priority:
                    # Heuristic: Only redispatch if it significantly helps
                    if eta < min_eta:
                        min_eta = eta
                        best_amb = amb
            except ValueError:
                continue
        
        return best_amb, min_eta

    def assign_emergency(self, location: str, priority: Priority = Priority.NORMAL):
        """Adds emergency to queue and attempts to dispatch best ambulance."""
        self.stats["emergencies"] += 1
        heapq.heappush(self.emergency_queue, (priority, location))
        self._fire(AlertEvent(EventType.EMERGENCY, location, f"CRITICAL: Emergency Level {priority.name} reported at {location}!"))
        self.process_queue()

    def process_queue(self):
        """Processes the emergency queue and dispatches available or better-suited ambulances."""
        if not self.emergency_queue: return

        # Try to assign the highest priority emergency
        priority, location = heapq.heappop(self.emergency_queue)
        amb, eta = self.find_best_ambulance(location, priority)

        if amb:
            if amb.active:
                # Handle Dynamic Re-dispatch
                self.stats["redispatches"] += 1
                amb.stats["redispatches"] += 1
                old_loc = amb.route[-1]
                logger.info(f"DIVERSION: Ambulance {amb.id} diverted from {old_loc} to {location}")
                self._fire(AlertEvent(
                    EventType.REDISPATCHED, 
                    location, 
                    f"DIVERSION: Ambulance {amb.id} reassigned to {location} (ETA: {eta:.1f}m)",
                    metadata={"ambulance_id": amb.id, "priority": priority.name}
                ))
            else:
                self._fire(AlertEvent(
                    EventType.DISPATCHED, 
                    location, 
                    f"Ambulance {amb.id} dispatched to {location} (ETA: {eta:.1f}m)",
                    metadata={"ambulance_id": amb.id, "priority": priority.name}
                ))

            try:
                path, _ = self.router.get_path_and_eta(amb.current_location, location, self.blocked)
                amb.route = path
                amb.route_index = 0
                amb.active = True
                amb.current_priority = priority
            except ValueError:
                logger.error(f"Failed to find route for {amb.id} to {location} after selection!")
                heapq.heappush(self.emergency_queue, (priority, location))
        else:
            # Re-queue if no ambulance could reach
            heapq.heappush(self.emergency_queue, (priority, location))
            logger.warning(f"No ambulance available for emergency at {location}. Re-queued.")

    def detect_obstacle(self):
        """Simulates AI object detection trained via Datature (car, pedestrian, obstacle)."""
        time.sleep(0.5)  # AI Inference delay
        if random.random() < 0.7:
            return True, random.choice(["car", "pedestrian", "obstacle"])
        return False, None

    def _fire(self, event: AlertEvent):
        self.event_log.append(event.to_dict())
        self.dispatcher.fire(event)

    def _reroute(self, amb: Ambulance, blocked_node: str):
        self.blocked.add(blocked_node)
        current_node = amb.current_location
        destination = amb.route[-1]
        try:
            new_path, _ = self.router.get_path_and_eta(current_node, destination, self.blocked)
            amb.route = amb.route[:amb.route_index] + new_path
            return True
        except ValueError:
            return False

    def step(self):
        if not self.is_running: return False
        
        # Periodically try to process queue in case an ambulance became free
        self.process_queue()

        active_found = False
        for amb in self.ambulances:
            if not amb.active: continue
            active_found = True

            if amb.route_index >= len(amb.route):
                amb.active = False
                amb.current_priority = Priority.NORMAL
                continue

            location = amb.route[amb.route_index]
            amb.current_location = location
            
            self._fire(AlertEvent(
                EventType.APPROACHING, 
                location, 
                f"Ambulance {amb.id} approaching {location}",
                metadata={"ambulance_id": amb.id}
            ))

            # 2. Random Event (AI-Powered Detection)
            detected, obj_type = self.detect_obstacle()
            if detected:
                amb.stats["obstacles"] += 1
                self._fire(AlertEvent(
                    EventType.OBSTACLE, 
                    location, 
                    f"AI DETECTED: {obj_type} at {location}. {amb.id} slowing down.",
                    metadata={"ambulance_id": amb.id, "ai_detected": obj_type}
                ))
            else:
                rand = random.random()
                if rand < 0.10: # Blockage
                    amb.stats["blockages"] += 1
                    if amb.route_index < len(amb.route) - 1:
                        next_node = amb.route[amb.route_index + 1]
                        self._fire(AlertEvent(EventType.BLOCKAGE, next_node, f"CRITICAL: Road blockage at {next_node}. Rerouting {amb.id}..."))
                        if not self._reroute(amb, next_node):
                            self._fire(AlertEvent(EventType.BLOCKAGE, next_node, f"ERROR: {amb.id} has no alternative route!"))

            amb.route_index += 1
            if amb.route_index == len(amb.route):
                self._fire(AlertEvent(
                    EventType.ARRIVED, 
                    location, 
                    f"Ambulance {amb.id} reached destination: {location}.",
                    metadata={"ambulance_id": amb.id}
                ))
                amb.active = False
                amb.current_priority = Priority.NORMAL
            
        return active_found

    def run(self):
        self.is_running = True
        while self.is_running:
            if not self.step(): break
            time.sleep(CONFIG["SIMULATION_DELAY"])

def build_system(config=None):
    if config: CONFIG.update(config)
    dispatcher = EventDispatcher()
    dispatcher.start()
    manager = AlertManager(dispatcher)
    engine = SimulationEngine(dispatcher)
    engine.add_ambulance("AMB-01", "Hospital")
    engine.add_ambulance("AMB-02", "ParkAve")
    engine.add_ambulance("AMB-03", "ElmSt")
    return dispatcher, engine

if __name__ == "__main__":
    d, e = build_system()
    try:
        e.is_running = True
        e.assign_emergency("Destination", Priority.CRITICAL)
        e.run()
    finally:
        d.stop()
