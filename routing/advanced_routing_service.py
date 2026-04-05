"""
LifeLine-AI - Advanced Production FastAPI Routing Service v2.0

Features:
- Multiple routing algorithms (Dijkstra, A*, BFS)
- External API integration (Google Maps, OSRM, ORS)
- Bulk routing with batch processing
- Redis caching with TTL
- Real-time metrics and monitoring
- Rate limiting and security
- Event streaming support
- Async request processing
- API versioning (v1, v2, v3)
- Comprehensive error handling
- Load balancing support

Author: LifeLine-AI Engineering
"""

import asyncio
import logging
import time
import json
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from functools import lru_cache, wraps
import redis
from collections import deque
from contextlib import asynccontextmanager

# Removed banned dependencies
# Import advanced routing engine
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from advanced_map_utils import (
    AdvancedRoutingEngine, TrafficLevel, RoutingAlgorithm,
    create_advanced_engine, Coordinate, APIProvider
)

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


# ==================== CONFIGURATION ====================

class Config:
    """Application configuration from environment"""
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    REDIS_ENABLED = os.getenv("REDIS_ENABLED", "true").lower() == "true"
    CACHE_TTL = int(os.getenv("CACHE_TTL", "300"))  # 5 minutes
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "60"))  # 1 minute
    ENABLE_EXTERNAL_APIS = os.getenv("ENABLE_EXTERNAL_APIS", "true").lower() == "true"
    GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
    OSRM_SERVER_URL = os.getenv("OSRM_SERVER_URL", "http://router.project-osrm.org")
    MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", "100"))
    REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "10"))


# ==================== REDIS CLIENT ====================

class RedisCache:
    """Redis-based caching layer"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        try:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()
            self.enabled = True
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}, using in-memory cache")
            self.redis_client = None
            self.enabled = False
            self.memory_cache = {}
    
    def get(self, key: str) -> Optional[Dict]:
        """Get from cache"""
        try:
            if self.redis_client:
                value = self.redis_client.get(key)
                return json.loads(value) if value else None
            else:
                return self.memory_cache.get(key)
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
            return None
    
    def set(self, key: str, value: Dict, ttl: int = 300) -> bool:
        """Set cache with TTL"""
        try:
            json_value = json.dumps(value)
            if self.redis_client:
                self.redis_client.setex(key, ttl, json_value)
            else:
                self.memory_cache[key] = value
            return True
        except Exception as e:
            logger.warning(f"Cache set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete cache entry"""
        try:
            if self.redis_client:
                self.redis_client.delete(key)
            else:
                self.memory_cache.pop(key, None)
            return True
        except Exception as e:
            logger.warning(f"Cache delete error: {e}")
            return False
    
    def clear(self) -> bool:
        """Clear all cache"""
        try:
            if self.redis_client:
                self.redis_client.flushdb()
            else:
                self.memory_cache.clear()
            return True
        except Exception as e:
            logger.warning(f"Cache clear error: {e}")
            return False
    
    def health(self) -> Dict:
        """Get cache health status"""
        if self.redis_client:
            try:
                self.redis_client.ping()
                info = self.redis_client.info()
                return {
                    "status": "healthy",
                    "type": "redis",
                    "used_memory": info.get("used_memory_human", "unknown"),
                    "connected_clients": info.get("connected_clients", 0)
                }
            except:
                return {"status": "unhealthy", "type": "redis"}
        else:
            return {
                "status": "active",
                "type": "in-memory",
                "entries": len(self.memory_cache)
            }


# ==================== RATE LIMITING ====================

class RateLimiter:
    """Token bucket rate limiting"""
    
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window = window_seconds
        self.buckets = {}  # {client_id: [(timestamp, count)]}
    
    def is_allowed(self, client_id: str) -> bool:
        """Check if request is allowed"""
        now = time.time()
        
        if client_id not in self.buckets:
            self.buckets[client_id] = deque([(now, 1)])
            return True
        
        # Remove old requests outside window
        while self.buckets[client_id] and self.buckets[client_id][0][0] < now - self.window:
            self.buckets[client_id].popleft()
        
        # Count requests in window
        request_count = len(self.buckets[client_id])
        
        if request_count < self.max_requests:
            self.buckets[client_id].append((now, request_count + 1))
            return True
        
        return False
    
    def get_remaining(self, client_id: str) -> int:
        """Get remaining requests for client"""
        now = time.time()
        
        if client_id not in self.buckets:
            return self.max_requests
        
        # Remove old requests
        while self.buckets[client_id] and self.buckets[client_id][0][0] < now - self.window:
            self.buckets[client_id].popleft()
        
        return max(0, self.max_requests - len(self.buckets[client_id]))


# ==================== DATA MODELS ====================

class CoordinateInput(BaseModel):
    """Coordinate input model"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lon: float = Field(..., ge=-180, le=180, description="Longitude")


class RouteRequest(BaseModel):
    """Single route request"""
    source_lat: float = Field(..., ge=-90, le=90)
    source_lon: float = Field(..., ge=-180, le=180)
    dest_lat: float = Field(..., ge=-90, le=90)
    dest_lon: float = Field(..., ge=-180, le=180)
    num_alternatives: int = Field(1, ge=1, le=10)
    traffic_level: Optional[str] = None
    algorithm: str = Field("fastest", description="Routing algorithm: fastest, shortest, balanced")
    
    @validator('traffic_level')
    def validate_traffic(cls, v):
        if v and v not in [tl.name for tl in TrafficLevel]:
            raise ValueError(f"Invalid traffic level: {v}")
        return v


class BulkRouteRequest(BaseModel):
    """Bulk routing request"""
    routes: List[RouteRequest] = Field(..., min_items=1, max_items=100)
    parallel: bool = Field(True, description="Process routes in parallel")


class RouteSegmentResponse(BaseModel):
    """Route segment response"""
    from_: str = Field(..., alias="from")
    to: str
    distance_km: float
    avg_speed_kmh: float
    description: str
    base_time_minutes: float


class RouteResponse(BaseModel):
    """Single route response"""
    route_id: str
    distance_km: float
    base_time_minutes: float
    estimated_time_minutes: float
    traffic_multiplier: float
    segments: List[RouteSegmentResponse]
    algorithm_used: str
    cost_score: float


class RoutesResponse(BaseModel):
    """Multiple routes response"""
    status: str
    distance_km: float
    eta_minutes: float
    eta_with_traffic_minutes: float
    traffic_condition: str
    best_route: RouteResponse
    alternatives: List[RouteResponse]
    api_provider: str
    cache_hit: bool
    computation_time_ms: float
    api_version: str = "2.0"


class HealthResponse(BaseModel):
    """Service health response"""
    status: str
    timestamp: str
    version: str
    engine: str
    cache: Dict
    uptime_seconds: float
    requests_total: int
    requests_per_minute: float


class MetricsResponse(BaseModel):
    """Service metrics"""
    timestamp: str
    requests_total: int
    requests_successful: int
    requests_failed: int
    avg_latency_ms: float
    cache_hit_rate: float
    api_calls_total: int
    api_calls_by_provider: Dict[str, int]
    algorithms_used: Dict[str, int]


# ==================== REQUEST/RESPONSE LOGGING ====================

class RequestLogger:
    """Log and analyze requests"""
    
    def __init__(self, max_entries: int = 10000):
        self.entries = deque(maxlen=max_entries)
        self.start_time = time.time()
    
    def log(self, 
           method: str,
           endpoint: str,
           status: int,
           latency_ms: float,
           cache_hit: bool = False,
           api_provider: str = "local"):
        """Log request"""
        self.entries.append({
            "timestamp": datetime.now().isoformat(),
            "method": method,
            "endpoint": endpoint,
            "status": status,
            "latency_ms": latency_ms,
            "cache_hit": cache_hit,
            "api_provider": api_provider
        })
    
    def get_stats(self) -> Dict:
        """Get request statistics"""
        if not self.entries:
            return {}
        
        recent = list(self.entries)[-1000:]  # Last 1000
        successful = sum(1 for e in recent if 200 <= e['status'] < 300)
        failed = sum(1 for e in recent if e['status'] >= 400)
        cache_hits = sum(1 for e in recent if e['cache_hit'])
        latencies = [e['latency_ms'] for e in recent]
        
        return {
            "requests_total": len(self.entries),
            "requests_recent": len(recent),
            "requests_successful": successful,
            "requests_failed": failed,
            "cache_hit_rate": cache_hits / len(recent) if recent else 0,
            "avg_latency_ms": sum(latencies) / len(latencies) if latencies else 0,
            "p95_latency_ms": sorted(latencies)[int(len(latencies) * 0.95)] if latencies else 0,
            "p99_latency_ms": sorted(latencies)[int(len(latencies) * 0.99)] if latencies else 0,
        }


