import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers import auth, borrow, requests, items, moderation

app = FastAPI()

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

@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

import asyncio
from app.utils.cleanup import cleanup_background_loop

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_background_loop())

