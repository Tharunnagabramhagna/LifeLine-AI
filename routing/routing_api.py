"""
LifeLine-AI Routing API Adapter
Adapted for utility logic only, stripped of FastAPI and Redis dependencies.
"""

from map_utils import (
    Coordinate, RouteType, TrafficLevel, RouteResponse, Graph,
    HybridRouter, CHENNAI_GRAPH, compute_route,
    GoogleMapsHandler, OSRMHandler, ORSHandler, traffic_predictor
)
import time

class MemoryCacheManager:
    """In-memory cache manager fallback"""
    def __init__(self, ttl_seconds: int = 300):
        self.ttl = ttl_seconds
        self.lru_cache = {}

    def _make_cache_key(self, source: Coordinate, dest: Coordinate, route_type: RouteType) -> str:
        key_data = f"{source.lat:.6f},{source.lon:.6f},{dest.lat:.6f},{dest.lon:.6f},{route_type.value}"
        import hashlib
        return hashlib.md5(key_data.encode()).hexdigest()

    async def get(self, key: str):
        return self.lru_cache.get(key)

    async def set(self, key: str, value):
        if len(self.lru_cache) > 1000:
            oldest_key = next(iter(self.lru_cache))
            del self.lru_cache[oldest_key]
        self.lru_cache[key] = value

class CachedHybridRouter(HybridRouter):
    """Hybrid router with caching using memory cache"""
    def __init__(self, graph: Graph, cache_manager: MemoryCacheManager):
        super().__init__(graph)
        self.cache = cache_manager

    async def get_route(self, source: Coordinate, dest: Coordinate,
                       route_type: RouteType = RouteType.FASTEST,
                       num_alternatives: int = 3) -> RouteResponse:
        cache_key = self.cache._make_cache_key(source, dest, route_type)
        cached_result = await self.cache.get(cache_key)
        if cached_result:
            cached_result.computation_time_ms = 0.0
            return cached_result
        
        result = await super().get_route(source, dest, route_type, num_alternatives)
        await self.cache.set(cache_key, result)
        return result

# Core instance mapping
cache_instance = MemoryCacheManager()
router = CachedHybridRouter(CHENNAI_GRAPH, cache_instance)