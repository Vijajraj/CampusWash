import os
import sys
import traceback

# Add backend directory to sys.path for Vercel deployment module resolution
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

error_traceback = None
app = FastAPI()

try:
    from app.routers import auth, borrow, requests, items, moderation
    import asyncio
    from app.utils.cleanup import cleanup_background_loop

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
        allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/api/v1/auth")
    app.include_router(borrow.router, prefix="/api/v1/borrow")
    app.include_router(requests.router, prefix="/api/v1/requests")
    app.include_router(items.router, prefix="/api/v1/items")
    app.include_router(moderation.router, prefix="/api/v1/admin")

    @app.on_event("startup")
    async def startup_event():
        asyncio.create_task(cleanup_background_loop())

except Exception as e:
    error_traceback = traceback.format_exc()

@app.get("/health")
async def health():
    if error_traceback:
        return {"status": "error", "traceback": error_traceback}
    return {"status": "ok"}

@app.get("/api/v1/health")
async def api_health():
    if error_traceback:
        return {"status": "error", "traceback": error_traceback}
    return {"status": "ok"}

# Catch-all error reporter in case of initialization failure
@app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
async def catch_all(path_name: str):
    if error_traceback:
        return {"status": "error", "traceback": error_traceback}
    return {"status": "not_found", "path": path_name}
