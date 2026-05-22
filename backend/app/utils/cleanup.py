import os
import io
import re
import json
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from app.db import supabase

LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "logs")
LOGS_FILE = os.path.join(LOGS_DIR, "cleanup_logs.json")

def ensure_logs_exist():
    if not os.path.exists(LOGS_DIR):
        os.makedirs(LOGS_DIR)
    if not os.path.exists(LOGS_FILE):
        with open(LOGS_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)

def append_cleanup_log(log_entry: Dict[str, Any]):
    ensure_logs_exist()
    try:
        with open(LOGS_FILE, "r", encoding="utf-8") as f:
            logs = json.load(f)
    except Exception:
        logs = []
    
    logs.append(log_entry)
    
    try:
        with open(LOGS_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2)
    except Exception as e:
        print(f"Failed to write cleanup log: {e}")

async def get_user_details(user_id: str) -> Optional[Dict[str, str]]:
    try:
        res = supabase.table("users").select("id, email, name").eq("id", user_id).maybe_single().execute()
        if res.data:
            return {
                "id": res.data.get("id"),
                "email": res.data.get("email"),
                "name": res.data.get("name") or "Unknown"
            }
    except Exception as e:
        print(f"Error fetching user details for {user_id}: {e}")
    return None

async def delete_supabase_image(image_url: str) -> bool:
    try:
        clean_url = image_url.split("?")[0]
        bucket = "item-images" if "item-images" in clean_url else "lend-images"
        prefix = f"/object/public/{bucket}/"
        if prefix in clean_url:
            filepath = clean_url.split(prefix)[-1]
            # Supabase delete expects a list of paths
            res = supabase.storage.from_(bucket).remove([filepath])
            print(f"Deleted image {filepath} from bucket {bucket}: {res}")
            return True
    except Exception as e:
        print(f"Error deleting image from storage: {e}")
    return False

async def run_cleanup_job():
    print(f"Starting automatic cleanup job at {datetime.now(timezone.utc).isoformat()}...")
    
    # Calculate threshold (7 days ago)
    threshold = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    
    # 1. Clean up Lost Items
    try:
        lost_res = supabase.table("lost_items").select("*").lt("created_at", threshold).execute()
        for item in lost_res.data or []:
            image_url = item.get("image_url")
            if image_url:
                print(f"Cleaning up Lost Item image: {item['id']} ({item['title']})")
                success = await delete_supabase_image(image_url)
                if success:
                    # Update database
                    supabase.table("lost_items").update({"image_url": None}).eq("id", item["id"]).execute()
                    
                    # Fetch sender (poster) details
                    sender_details = await get_user_details(item.get("user_id"))
                    
                    # Log cleanup
                    log_entry = {
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "event": "image_removed",
                        "item_id": item["id"],
                        "item_type": "lost_item",
                        "title": item["title"],
                        "created_at": item["created_at"],
                        "sender": sender_details,
                        "getter": None
                    }
                    append_cleanup_log(log_entry)
    except Exception as e:
        print(f"Error during lost items cleanup: {e}")

    # 2. Clean up Found Items
    try:
        found_res = supabase.table("found_items").select("*").lt("created_at", threshold).execute()
        for item in found_res.data or []:
            image_url = item.get("image_url")
            if image_url:
                print(f"Cleaning up Found Item image: {item['id']} ({item['title']})")
                success = await delete_supabase_image(image_url)
                if success:
                    # Update database
                    supabase.table("found_items").update({"image_url": None}).eq("id", item["id"]).execute()
                    
                    # Fetch sender (finder) details
                    sender_details = await get_user_details(item.get("user_id"))
                    
                    # Resolve claimant (getter)
                    getter_details = None
                    description = item.get("description") or ""
                    match = re.search(r'\[Claimed By:\s*([a-f0-9\-]{36})\]', description)
                    if match:
                        claimant_id = match.group(1)
                        getter_details = await get_user_details(claimant_id)
                    
                    # Log cleanup
                    log_entry = {
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "event": "image_removed",
                        "item_id": item["id"],
                        "item_type": "found_item",
                        "title": item["title"],
                        "created_at": item["created_at"],
                        "sender": sender_details,
                        "getter": getter_details
                    }
                    append_cleanup_log(log_entry)
    except Exception as e:
        print(f"Error during found items cleanup: {e}")

    # 3. Clean up Lend Listings
    try:
        lend_res = supabase.table("lend_listings").select("*").lt("created_at", threshold).execute()
        for item in lend_res.data or []:
            image_url = item.get("image_url")
            if image_url:
                print(f"Cleaning up Lend Listing image: {item['id']} ({item['title']})")
                success = await delete_supabase_image(image_url)
                if success:
                    # Update database
                    supabase.table("lend_listings").update({"image_url": None}).eq("id", item["id"]).execute()
                    
                    # Fetch sender (lender) details
                    sender_details = await get_user_details(item.get("owner_id"))
                    
                    # Resolve borrower (getter)
                    getter_details = None
                    req_res = supabase.table("borrow_requests").select("borrower_id").eq("listing_id", item["id"]).in_("status", ["approved", "returned"]).maybe_single().execute()
                    if req_res.data:
                        borrower_id = req_res.data.get("borrower_id")
                        getter_details = await get_user_details(borrower_id)
                        
                    # Log cleanup
                    log_entry = {
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "event": "image_removed",
                        "item_id": item["id"],
                        "item_type": "lend_listing",
                        "title": item["title"],
                        "created_at": item["created_at"],
                        "sender": sender_details,
                        "getter": getter_details
                    }
                    append_cleanup_log(log_entry)
    except Exception as e:
        print(f"Error during lend listings cleanup: {e}")
        
    print("Automatic cleanup job finished.")

async def cleanup_background_loop():
    # Wait for app startup
    await asyncio.sleep(5)
    while True:
        try:
            await run_cleanup_job()
        except Exception as e:
            print(f"Error in background cleanup execution: {e}")
        # Run every hour
        await asyncio.sleep(3600)
