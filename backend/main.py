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

# Startup Environment Variable Validation (non-fatal — log warnings instead of crashing)
REQUIRED_ENV_VARS = [
    "JWT_SECRET",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
]
# Optional vars that are nice to have but shouldn't crash the server
OPTIONAL_ENV_VARS = []

missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
missing_optional = [var for var in OPTIONAL_ENV_VARS if not os.getenv(var)]

if missing_vars:
    print(f"⚠️  WARNING: Missing required environment variables: {', '.join(missing_vars)}", file=sys.stderr)
    print("⚠️  Some features may not work correctly.", file=sys.stderr)

clerk_secret = os.getenv("CLERK_SECRET_KEY")
clerk_pub = os.getenv("CLERK_PEM_PUBLIC_KEY")
if not clerk_secret and not clerk_pub:
    print("⚠️  WARNING: Missing both CLERK_SECRET_KEY and CLERK_PEM_PUBLIC_KEY. Authentication will not function.", file=sys.stderr)

if missing_optional:
    print(f"ℹ️  INFO: Missing optional environment variables: {', '.join(missing_optional)}", file=sys.stderr)

error_traceback = None
app = FastAPI()

try:
    from app.routers import auth, borrow, requests, items, moderation

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
