"""
LifeLine-AI Routing Engine
Core graph-based routing system for emergency response

Features:
- Dijkstra's algorithm for optimal paths
- A* algorithm with Haversine heuristic for real-time routing
- Multiple route criteria: fastest, shortest, least traffic
- Haversine distance calculations
- ETA estimation with traffic factors
- Dynamic traffic simulation
- Route scoring system
- Fully offline capable
"""

import asyncio
import aiohttp
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import json

class RouteType(Enum):
    FASTEST = "fastest"
    SHORTEST = "shortest"
    LEAST_TRAFFIC = "least_traffic"

class TrafficLevel(Enum):
    LIGHT = "light"
    MODERATE = "moderate"
    HEAVY = "heavy"

@dataclass
class Coordinate:
    lat: float
    lon: float

    def __post_init__(self):
        if not -90 <= self.lat <= 90:
            raise ValueError(f"Latitude must be between -90 and 90, got {self.lat}")
        if not -180 <= self.lon <= 180:
            raise ValueError(f"Longitude must be between -180 and 180, got {self.lon}")

@dataclass
class RouteSegment:
    start: Coordinate
    end: Coordinate
    distance_km: float
    speed_kmh: float
    traffic_level: TrafficLevel

@dataclass
class Route:
    segments: List[RouteSegment]
    total_distance_km: float
    total_time_minutes: float
    traffic_penalty: float
    score: float
    route_type: RouteType

@dataclass
class RouteResponse:
    best_route: Route
    distance_km: float
    eta_minutes: float
    alternatives: List[Route]
    computation_time_ms: float

class Graph:
    """Graph representation of the road network"""

    def __init__(self):
        self.nodes: Dict[str, Coordinate] = {}
        self.edges: Dict[str, List[Tuple[str, float, float]]] = {}  # node -> [(neighbor, distance, speed)]
        self.kd_tree = None

    def add_node(self, node_id: str, coord: Coordinate):
        self.nodes[node_id] = coord
        if node_id not in self.edges:
            self.edges[node_id] = []

    def build_spatial_index(self):
        """Build KD-Tree for spatial queries"""
        if not self.nodes:
            return

        points = [((coord.lat, coord.lon), node_id) for node_id, coord in self.nodes.items()]
        self.kd_tree = KDTree(points)

    def add_edge(self, from_node: str, to_node: str, distance_km: float, speed_kmh: float = 40.0):
        if from_node not in self.edges:
            self.edges[from_node] = []
        if to_node not in self.edges:
            self.edges[to_node] = []
        self.edges[from_node].append((to_node, distance_km, speed_kmh))
        # Add reverse edge for bidirectional roads
        self.edges[to_node].append((from_node, distance_km, speed_kmh))

    def get_neighbors(self, node_id: str) -> List[Tuple[str, float, float]]:
        return self.edges.get(node_id, [])

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great circle distance between two points using Haversine formula
    Returns distance in kilometers
    """
    R = 6371.0  # Earth's radius in km

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def get_traffic_multiplier(traffic_level: TrafficLevel, current_time: Optional[datetime] = None) -> float:
    """
    Get traffic multiplier based on level and time of day
    """
    base_multiplier = {
        TrafficLevel.LIGHT: 1.0,
        TrafficLevel.MODERATE: 1.3,
        TrafficLevel.HEAVY: 1.8
    }[traffic_level]

    # Add peak hour multiplier
    if current_time:
        hour = current_time.hour
        # Morning peak: 7-9 AM, Evening peak: 5-7 PM
        if (7 <= hour <= 9) or (17 <= hour <= 19):
            base_multiplier *= 1.5

    return base_multiplier

def calculate_eta(distance_km: float, speed_kmh: float, traffic_multiplier: float) -> float:
    """
    Calculate ETA in minutes
    """
    effective_speed = speed_kmh / traffic_multiplier
    time_hours = distance_km / effective_speed
    return time_hours * 60

def dijkstra(graph: Graph, start: str, end: str, route_type: RouteType = RouteType.SHORTEST) -> Optional[Route]:
    """
    Dijkstra's algorithm for finding optimal path
    """
    if start not in graph.nodes or end not in graph.nodes:
        return None

    # Priority queue: (cost, node, path)
    pq = [(0, start, [])]
    visited = set()
    costs = {start: 0}

    while pq:
        cost, current, path = heapq.heappop(pq)

        if current in visited:
            continue
        visited.add(current)

        current_path = path + [current]

        if current == end:
            # Reconstruct route
            return reconstruct_route(graph, current_path, route_type)

        for neighbor, distance, speed in graph.get_neighbors(current):
            if neighbor in visited:
                continue

            # Calculate edge cost based on route type
            if route_type == RouteType.SHORTEST:
                edge_cost = distance
            elif route_type == RouteType.FASTEST:
                edge_cost = distance / speed  # Time-based
            else:  # LEAST_TRAFFIC - will be handled in A* with traffic
                edge_cost = distance

            new_cost = cost + edge_cost

            if neighbor not in costs or new_cost < costs[neighbor]:
                costs[neighbor] = new_cost
                heapq.heappush(pq, (new_cost, neighbor, current_path))

    return None

def a_star(graph: Graph, start: str, end: str, route_type: RouteType = RouteType.FASTEST) -> Optional[Route]:
    """
    A* algorithm with Haversine heuristic for real-time routing
    """
    if start not in graph.nodes or end not in graph.nodes:
        return None

    def heuristic(node_id: str) -> float:
        """Haversine distance to goal as heuristic"""
        node_coord = graph.nodes[node_id]
        end_coord = graph.nodes[end]
        return haversine_distance(node_coord.lat, node_coord.lon, end_coord.lat, end_coord.lon)

    # Priority queue: (f_score, g_score, node, path)
    pq = [(heuristic(start), 0, start, [])]
    visited = set()
    g_scores = {start: 0}
    f_scores = {start: heuristic(start)}

    while pq:
        f_score, g_score, current, path = heapq.heappop(pq)

        if current in visited:
            continue
        visited.add(current)

        current_path = path + [current]

        if current == end:
            return reconstruct_route(graph, current_path, route_type)

        for neighbor, distance, speed in graph.get_neighbors(current):
            if neighbor in visited:
                continue

            # Calculate edge cost
            if route_type == RouteType.LEAST_TRAFFIC:
                # Simulate traffic - use current time for dynamic traffic
                current_time = datetime.now()
                traffic_level = simulate_traffic(current_time)
                traffic_mult = get_traffic_multiplier(traffic_level, current_time)
                edge_cost = calculate_eta(distance, speed, traffic_mult)
            elif route_type == RouteType.FASTEST:
                edge_cost = distance / speed
            else:
                edge_cost = distance

            tentative_g = g_score + edge_cost

            if neighbor not in g_scores or tentative_g < g_scores[neighbor]:
                g_scores[neighbor] = tentative_g
                f_scores[neighbor] = tentative_g + heuristic(neighbor)
                heapq.heappush(pq, (f_scores[neighbor], tentative_g, neighbor, current_path))

    return None

def reconstruct_route(graph: Graph, path: List[str], route_type: RouteType) -> Route:
    """
    Reconstruct route from path with segments and scoring
    """
    segments = []
    total_distance = 0
    total_time = 0
    traffic_penalty = 0

    current_time = datetime.now()

    for i in range(len(path) - 1):
        start_node = path[i]
        end_node = path[i + 1]

        start_coord = graph.nodes[start_node]
        end_coord = graph.nodes[end_node]

        # Find edge data
        for neighbor, distance, speed in graph.get_neighbors(start_node):
            if neighbor == end_node:
                # Simulate traffic for this segment
                traffic_level = simulate_traffic(current_time)
                traffic_mult = get_traffic_multiplier(traffic_level, current_time)

                segment = RouteSegment(
                    start=start_coord,
                    end=end_coord,
                    distance_km=distance,
                    speed_kmh=speed,
                    traffic_level=traffic_level
                )

                segments.append(segment)
                total_distance += distance
                total_time += calculate_eta(distance, speed, traffic_mult)
                traffic_penalty += (traffic_mult - 1.0) * distance  # Penalty based on traffic
                break

    # Calculate route score
    score = calculate_route_score(total_distance, total_time, traffic_penalty, route_type)

    return Route(
        segments=segments,
        total_distance_km=total_distance,
        total_time_minutes=total_time,
        traffic_penalty=traffic_penalty,
        score=score,
        route_type=route_type
    )

def calculate_route_score(distance: float, time_minutes: float, traffic_penalty: float, route_type: RouteType) -> float:
    """
    Calculate route score with AI learning adjustment
    Lower score is better
    """
    time_weight = 1.0

    if route_type == RouteType.SHORTEST:
        time_weight = 0.1  # Prioritize distance
    elif route_type == RouteType.FASTEST:
        time_weight = 2.0  # Prioritize time
    elif route_type == RouteType.LEAST_TRAFFIC:
        time_weight = 1.5  # Balance time and traffic

    base_score = distance + (time_minutes * time_weight) + traffic_penalty

    # Create a dummy route for AI adjustment
    dummy_route = Route(
        segments=[],
        total_distance_km=distance,
        total_time_minutes=time_minutes,
        traffic_penalty=traffic_penalty,
        score=base_score,
        route_type=route_type
    )

    # Apply AI adjustment
    adjusted_score = traffic_predictor.adjust_route_score(dummy_route)

    return adjusted_score

def simulate_traffic(current_time: datetime) -> TrafficLevel:
    """
    Simulate traffic with AI prediction
    """
    return traffic_predictor.predict_traffic(current_time)

class KDNode:
    """KD-Tree node for spatial indexing"""

    def __init__(self, point: Tuple[float, float], node_id: str, depth: int = 0):
        self.point = point  # (lat, lon)
        self.node_id = node_id
        self.depth = depth
        self.left = None
        self.right = None

class KDTree:
    """KD-Tree for efficient nearest neighbor search in 2D space"""

    def __init__(self, points: List[Tuple[Tuple[float, float], str]]):
        """
        points: List of ((lat, lon), node_id)
        """
        self.root = self._build_tree(points, 0) if points else None

    def _build_tree(self, points: List[Tuple[Tuple[float, float], str]], depth: int) -> Optional[KDNode]:
        if not points:
            return None

        # Alternate between lat (0) and lon (1)
        axis = depth % 2

        # Sort by current axis
        points.sort(key=lambda x: x[0][axis])

        # Find median
        median_idx = len(points) // 2
        median_point = points[median_idx]

        # Create node
        node = KDNode(median_point[0], median_point[1], depth)

        # Recursively build left and right subtrees
        node.left = self._build_tree(points[:median_idx], depth + 1)
        node.right = self._build_tree(points[median_idx + 1:], depth + 1)

        return node

    def nearest_neighbor(self, target: Tuple[float, float]) -> str:
        """
        Find nearest neighbor to target point
        Returns node_id of nearest point
        """
        if not self.root:
            raise ValueError("KD-Tree is empty")

        best_distance = float('inf')
        best_node = None

        def search(node: KDNode, target: Tuple[float, float], depth: int) -> None:
            nonlocal best_distance, best_node

            if not node:
                return

            # Calculate distance to current node
            current_distance = self._distance(node.point, target)

            if current_distance < best_distance:
                best_distance = current_distance
                best_node = node.node_id

            # Determine which subtree to search first
            axis = depth % 2
            if target[axis] < node.point[axis]:
                # Search left first
                search(node.left, target, depth + 1)
                # Check if we need to search right (ball within slab)
                if (node.point[axis] - target[axis]) ** 2 < best_distance:
                    search(node.right, target, depth + 1)
            else:
                # Search right first
                search(node.right, target, depth + 1)
                # Check if we need to search left
                if (target[axis] - node.point[axis]) ** 2 < best_distance:
                    search(node.left, target, depth + 1)

        search(self.root, target, 0)
        return best_node

    @staticmethod
    def _distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        """Euclidean distance (approximation for small areas)"""
        return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

class ExternalAPIHandler(ABC):
    """Abstract base class for external routing APIs"""

    def __init__(self, api_key: Optional[str] = None, timeout: float = 5.0):
        self.api_key = api_key
        self.timeout = timeout

    @abstractmethod
    async def get_route(self, source: Coordinate, dest: Coordinate) -> Optional[RouteResponse]:
        """Get route from external API"""
        pass

class GoogleMapsHandler(ExternalAPIHandler):
    """Google Maps API handler"""

    async def get_route(self, source: Coordinate, dest: Coordinate) -> Optional[RouteResponse]:
        try:
            url = "https://maps.googleapis.com/maps/api/directions/json"
            params = {
                'origin': f"{source.lat},{source.lon}",
                'destination': f"{dest.lat},{dest.lon}",
                'mode': 'driving',
                'key': self.api_key or ''
            }

            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        return None

                    data = await response.json()

                    if data.get('status') != 'OK' or not data.get('routes'):
                        return None

                    route = data['routes'][0]
                    leg = route['legs'][0]

                    # Validate required data
                    if not leg.get('distance') or not leg.get('duration') or not leg.get('steps'):
                        return None

                    # Convert to our format
                    distance_km = leg['distance']['value'] / 1000
                    duration_min = leg['duration']['value'] / 60

                    if distance_km <= 0 or duration_min <= 0:
                        return None

                    # Create route segments from steps
                    segments = []
                    for step in leg['steps']:
                        required_keys = ['start_location', 'end_location', 'distance', 'duration']
                        if not all(k in step for k in required_keys):
                            continue

                        try:
                            start_coord = Coordinate(
                                lat=step['start_location']['lat'],
                                lon=step['start_location']['lng']
                            )
                            end_coord = Coordinate(
                                lat=step['end_location']['lat'],
                                lon=step['end_location']['lng']
                            )

                            step_distance = step['distance']['value'] / 1000
                            step_duration = step['duration']['value'] / 60

                            if step_distance <= 0 or step_duration <= 0:
                                continue

                            # Estimate speed
                            speed = step_distance / (step_duration / 60) if step_duration > 0 else 40.0

                            segment = RouteSegment(
                                start=start_coord,
                                end=end_coord,
                                distance_km=step_distance,
                                speed_kmh=speed,
                                traffic_level=TrafficLevel.MODERATE
                            )
                            segments.append(segment)
                        except (KeyError, ValueError, TypeError):
                            continue

                    if not segments:
                        return None

                    route_obj = Route(
                        segments=segments,
                        total_distance_km=distance_km,
                        total_time_minutes=duration_min,
                        traffic_penalty=0.0,
                        score=distance_km + duration_min,
                        route_type=RouteType.FASTEST
                    )

                    return RouteResponse(
                        best_route=route_obj,
                        distance_km=distance_km,
                        eta_minutes=duration_min,
                        alternatives=[],
                        computation_time_ms=0.0
                    )

        except (KeyError, ValueError, TypeError, aiohttp.ClientError):
            return None
        except Exception:
            return None

class OSRMHandler(ExternalAPIHandler):
    """Open Source Routing Machine handler"""

    def __init__(self, base_url: str = "https://router.project-osrm.org", timeout: float = 5.0):
        super().__init__(timeout=timeout)
        self.base_url = base_url

    async def get_route(self, source: Coordinate, dest: Coordinate) -> Optional[RouteResponse]:
        try:
            url = f"{self.base_url}/route/v1/driving/{source.lon},{source.lat};{dest.lon},{dest.lat}"

            params = {
                'overview': 'full',
                'steps': 'true',
                'geometries': 'geojson'
            }

            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.get(url, params=params) as response:
                    if response.status != 200:
                        return None

                    data = await response.json()

                    if data.get('code') != 'Ok' or not data.get('routes'):
                        return None

                    route = data['routes'][0]

                    distance_km = route['distance'] / 1000
                    duration_min = route['duration'] / 60

                    # Create segments from legs
                    segments = []
                    for leg in route['legs']:
                        for step in leg['steps']:
                            # Use start/end of step
                            coords = step['geometry']['coordinates']
                            if len(coords) >= 2:
                                start_coord = Coordinate(lat=coords[0][1], lon=coords[0][0])
                                end_coord = Coordinate(lat=coords[-1][1], lon=coords[-1][0])

                                step_distance = step['distance'] / 1000
                                step_duration = step['duration'] / 60
                                speed = step_distance / (step_duration / 60) if step_duration > 0 else 40.0

                                segment = RouteSegment(
                                    start=start_coord,
                                    end=end_coord,
                                    distance_km=step_distance,
                                    speed_kmh=speed,
                                    traffic_level=TrafficLevel.LIGHT  # OSRM doesn't have traffic
                                )
                                segments.append(segment)

                    route_obj = Route(
                        segments=segments,
                        total_distance_km=distance_km,
                        total_time_minutes=duration_min,
                        traffic_penalty=0.0,
                        score=distance_km + duration_min,
                        route_type=RouteType.FASTEST
                    )

                    return RouteResponse(
                        best_route=route_obj,
                        distance_km=distance_km,
                        eta_minutes=duration_min,
                        alternatives=[],
                        computation_time_ms=0.0
                    )

        except Exception:
            return None

class ORSHandler(ExternalAPIHandler):
    """OpenRouteService handler"""

    def __init__(self, api_key: Optional[str] = None, timeout: float = 5.0):
        super().__init__(api_key, timeout)
        self.base_url = "https://api.openrouteservice.org/v2/directions/driving-car"

    async def get_route(self, source: Coordinate, dest: Coordinate) -> Optional[RouteResponse]:
        try:
            headers = {'Authorization': self.api_key} if self.api_key else {}
            payload = {
                "coordinates": [[source.lon, source.lat], [dest.lon, dest.lat]],
                "format": "geojson"
            }

            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
                async with session.post(self.base_url, json=payload, headers=headers) as response:
                    if response.status != 200:
                        return None

                    data = await response.json()

                    if not data.get('features'):
                        return None

                    feature = data['features'][0]
                    properties = feature['properties']
                    geometry = feature['geometry']

                    distance_km = properties['segments'][0]['distance'] / 1000
                    duration_min = properties['segments'][0]['duration'] / 60

                    # Create segments from geometry
                    coords = geometry['coordinates']
                    segments = []

                    for i in range(len(coords) - 1):
                        start_coord = Coordinate(lat=coords[i][1], lon=coords[i][0])
                        end_coord = Coordinate(lat=coords[i+1][1], lon=coords[i+1][0])

                        # Estimate distance and time for segment
                        segment_distance = haversine_distance(start_coord.lat, start_coord.lon,
                                                            end_coord.lat, end_coord.lon)
                        segment_time = segment_distance / 40.0 * 60  # Assume 40 km/h

                        segment = RouteSegment(
                            start=start_coord,
                            end=end_coord,
                            distance_km=segment_distance,
                            speed_kmh=40.0,
                            traffic_level=TrafficLevel.LIGHT
                        )
                        segments.append(segment)

                    route_obj = Route(
                        segments=segments,
                        total_distance_km=distance_km,
                        total_time_minutes=duration_min,
                        traffic_penalty=0.0,
                        score=distance_km + duration_min,
                        route_type=RouteType.FASTEST
                    )

                    return RouteResponse(
                        best_route=route_obj,
                        distance_km=distance_km,
                        eta_minutes=duration_min,
                        alternatives=[],
                        computation_time_ms=0.0
                    )

        except Exception:
            return None

class HybridRouter:
    """Hybrid router that tries external APIs first, then falls back to local engine"""

    def __init__(self, graph: Graph):
        self.graph = graph
        self.api_handlers = []

    def add_api_handler(self, handler: ExternalAPIHandler):
        """Add external API handler"""
        self.api_handlers.append(handler)

    async def get_route(self, source: Coordinate, dest: Coordinate,
                       route_type: RouteType = RouteType.FASTEST,
                       num_alternatives: int = 3) -> RouteResponse:
        """
        Get route using hybrid approach: APIs first, local fallback
        Fault-tolerant with automatic fallback
        """
        # Try external APIs first (with timeout)
        for handler in self.api_handlers:
            try:
                result = await asyncio.wait_for(
                    handler.get_route(source, dest),
                    timeout=3.0  # 3 second timeout per API
                )
                if result and result.distance_km > 0:  # Validate result
                    # Add alternatives using local engine
                    if num_alternatives > 1:
                        try:
                            local_result = compute_route(self.graph, source, dest, route_type, num_alternatives)
                            result.alternatives = local_result.alternatives[:num_alternatives-1]
                        except Exception:
                            pass  # Ignore local alternative failures
                    return result
            except (asyncio.TimeoutError, Exception) as e:
                # Log failure but continue to next API
                print(f"API {handler.__class__.__name__} failed: {e}")
                continue

        # All APIs failed, use local engine
        try:
            return compute_route(self.graph, source, dest, route_type, num_alternatives)
        except Exception as e:
            # Ultimate fallback: basic straight-line route
            print(f"Local routing failed: {e}, using fallback")
            return self._create_fallback_route(source, dest)

    def _create_fallback_route(self, source: Coordinate, dest: Coordinate) -> RouteResponse:
        """Create basic fallback route when everything fails"""
        distance = haversine_distance(source.lat, source.lon, dest.lat, dest.lon)
        time_minutes = distance / 30.0 * 60  # Assume 30 km/h average

        fallback_route = Route(
            segments=[
                RouteSegment(
                    start=source,
                    end=dest,
                    distance_km=distance,
                    speed_kmh=30.0,
                    traffic_level=TrafficLevel.MODERATE
                )
            ],
            total_distance_km=distance,
            total_time_minutes=time_minutes,
            traffic_penalty=0.0,
            score=distance + time_minutes,
            route_type=RouteType.FASTEST
        )

        return RouteResponse(
            best_route=fallback_route,
            distance_km=distance,
            eta_minutes=time_minutes,
            alternatives=[],
            computation_time_ms=0.0
        )

class TrafficPredictor:
    """Simple traffic prediction using historical patterns"""

    def __init__(self):
        self.traffic_history = {}  # hour -> traffic_level counts
        self.route_history = []  # List of (route, actual_time, predicted_time) tuples
        self.max_history = 1000

    def record_traffic(self, hour: int, traffic_level: TrafficLevel):
        """Record traffic observation"""
        if hour not in self.traffic_history:
            self.traffic_history[hour] = {TrafficLevel.LIGHT: 0, TrafficLevel.MODERATE: 0, TrafficLevel.HEAVY: 0}

        self.traffic_history[hour][traffic_level] += 1

    def record_route_performance(self, route: Route, actual_time: float):
        """Record route performance for learning"""
        predicted_time = route.total_time_minutes
        self.route_history.append((route, actual_time, predicted_time))

        # Keep only recent history
        if len(self.route_history) > self.max_history:
            self.route_history.pop(0)

    def predict_traffic(self, current_time: datetime) -> TrafficLevel:
        """Predict traffic based on historical patterns"""
        hour = current_time.hour

        if hour in self.traffic_history:
            counts = self.traffic_history[hour]
            total = sum(counts.values())
            if total > 0:
                # Return most common traffic level for this hour
                return max(counts.keys(), key=lambda x: counts[x])

        # Fallback to time-based heuristics
        return simulate_traffic(current_time)

    def adjust_route_score(self, route: Route) -> float:
        """Adjust route score based on learning"""
        if not self.route_history:
            return route.score

        # Simple learning: adjust based on recent performance
        recent_routes = self.route_history[-50:]  # Last 50 routes

        total_error = 0
        count = 0

        for hist_route, actual, predicted in recent_routes:
            if hist_route.route_type == route.route_type:
                error = abs(actual - predicted) / max(predicted, 1)  # Relative error
                total_error += error
                count += 1

        if count > 0:
            avg_error = total_error / count
            # Penalize routes with higher predicted error
            adjustment = 1 + (avg_error * 0.5)
            return route.score * adjustment

        return route.score

# Global traffic predictor
traffic_predictor = TrafficPredictor()

def find_nearest_node(graph: Graph, coord: Coordinate) -> str:
    """
    Find nearest node using KD-Tree for O(log n) performance
    """
    if graph.kd_tree:
        return graph.kd_tree.nearest_neighbor((coord.lat, coord.lon))

    # Fallback to linear search if no KD-Tree
    min_distance = float('inf')
    nearest_node = None

    for node_id, node_coord in graph.nodes.items():
        distance = haversine_distance(coord.lat, coord.lon, node_coord.lat, node_coord.lon)
        if distance < min_distance:
            min_distance = distance
            nearest_node = node_id

    return nearest_node

def compute_route(graph: Graph, source_coord: Coordinate, dest_coord: Coordinate,
                 route_type: RouteType = RouteType.FASTEST, num_alternatives: int = 3) -> RouteResponse:
    """
    Main routing function
    """
    import time
    start_time = time.time()

    # Find nearest nodes
    start_node = find_nearest_node(graph, source_coord)
    end_node = find_nearest_node(graph, dest_coord)

    if not start_node or not end_node:
        raise ValueError("Could not find route for given coordinates")

    # Compute primary route
    if route_type == RouteType.SHORTEST:
        best_route = dijkstra(graph, start_node, end_node, RouteType.SHORTEST)
    else:
        best_route = a_star(graph, start_node, end_node, route_type)

    if not best_route:
        raise ValueError("No route found between source and destination")

    # Generate alternatives by trying different route types
    alternatives = []
    route_types = [RouteType.FASTEST, RouteType.SHORTEST, RouteType.LEAST_TRAFFIC]
    route_types.remove(route_type)  # Remove the primary type

    for alt_type in route_types[:num_alternatives-1]:
        if alt_type == RouteType.SHORTEST:
            alt_route = dijkstra(graph, start_node, end_node, RouteType.SHORTEST)
        else:
            alt_route = a_star(graph, start_node, end_node, alt_type)

        if alt_route:
            alternatives.append(alt_route)

    computation_time = (time.time() - start_time) * 1000  # ms

    return RouteResponse(
        best_route=best_route,
        distance_km=best_route.total_distance_km,
        eta_minutes=best_route.total_time_minutes,
        alternatives=alternatives,
        computation_time_ms=computation_time
    )

# Initialize Chennai road network (sample data)
def create_chennai_graph() -> Graph:
    """
    Create sample Chennai road network
    """
    graph = Graph()

    # Major locations in Chennai
    locations = {
        "T_Nagar": Coordinate(13.0418, 80.2341),
        "Adyar": Coordinate(13.0067, 80.2575),
        "Velachery": Coordinate(12.9758, 80.2210),
        "Tambaram": Coordinate(12.9249, 80.1000),
        "Guindy": Coordinate(13.0067, 80.2206),
        "Anna_Nagar": Coordinate(13.0850, 80.2100),
        "Kodambakkam": Coordinate(13.0525, 80.2211),
        "Nungambakkam": Coordinate(13.0611, 80.2425),
        "Apollo_Hospital": Coordinate(13.0827, 80.2707),
        "Fortis_Hospital": Coordinate(13.0611, 80.2857)
    }

    # Add nodes
    for node_id, coord in locations.items():
        graph.add_node(node_id, coord)

    # Add edges with distances and typical speeds
    connections = [
        ("T_Nagar", "Adyar", 8.5, 35.0),
        ("T_Nagar", "Guindy", 6.2, 40.0),
        ("T_Nagar", "Anna_Nagar", 7.8, 45.0),
        ("Adyar", "Velachery", 4.2, 30.0),
        ("Velachery", "Tambaram", 12.1, 50.0),
        ("Guindy", "Velachery", 5.5, 35.0),
        ("Guindy", "Kodambakkam", 4.8, 40.0),
        ("Anna_Nagar", "Kodambakkam", 3.2, 35.0),
        ("Kodambakkam", "Nungambakkam", 2.1, 30.0),
        ("Nungambakkam", "Apollo_Hospital", 3.5, 35.0),
        ("Apollo_Hospital", "Fortis_Hospital", 2.8, 40.0),
        ("T_Nagar", "Nungambakkam", 5.2, 38.0),
        ("Adyar", "Guindy", 4.1, 32.0)
    ]

    for start, end, distance, speed in connections:
        graph.add_edge(start, end, distance, speed)

    # Build spatial index for fast nearest neighbor queries
    graph.build_spatial_index()

    return graph

# Global graph instance
CHENNAI_GRAPH = create_chennai_graph()