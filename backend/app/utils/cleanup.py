import os
import io
import re
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from app.db import supabase

# Configure standard Python logging to stdout
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cleanup")

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
        logger.error(f"Error fetching user details for {user_id}: {e}")
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
            logger.info(f"Deleted image {filepath} from bucket {bucket}: {res}")
            return True
    except Exception as e:
        logger.error(f"Error deleting image from storage: {e}")
    return False

async def run_cleanup_job() -> Dict[str, Any]:
    start_time = datetime.now(timezone.utc)
    logger.info(f"Starting automatic cleanup job at {start_time.isoformat()}...")
    
    # Calculate threshold (7 days ago)
    threshold = (start_time - timedelta(days=7)).isoformat()
    
    stats = {
        "lost_items_cleaned": 0,
        "found_items_cleaned": 0,
        "lend_listings_cleaned": 0,
        "errors": []
    }
    
    # 1. Clean up Lost Items
    try:
        lost_res = supabase.table("lost_items").select("*").lt("created_at", threshold).execute()
        for item in lost_res.data or []:
            image_url = item.get("image_url")
            if image_url:
                logger.info(f"Cleaning up Lost Item image: {item['id']} ({item['title']})")
                success = await delete_supabase_image(image_url)
                if success:
                    # Update database
                    supabase.table("lost_items").update({"image_url": None}).eq("id", item["id"]).execute()
                    stats["lost_items_cleaned"] += 1
    except Exception as e:
        err_msg = f"Error during lost items cleanup: {e}"
        logger.error(err_msg)
        stats["errors"].append(err_msg)

    # 2. Clean up Found Items
    try:
        found_res = supabase.table("found_items").select("*").lt("created_at", threshold).execute()
        for item in found_res.data or []:
            image_url = item.get("image_url")
            if image_url:
                logger.info(f"Cleaning up Found Item image: {item['id']} ({item['title']})")
                success = await delete_supabase_image(image_url)
                if success:
                    # Update database
                    supabase.table("found_items").update({"image_url": None}).eq("id", item["id"]).execute()
                    stats["found_items_cleaned"] += 1
    except Exception as e:
        err_msg = f"Error during found items cleanup: {e}"
        logger.error(err_msg)
        stats["errors"].append(err_msg)

    # 3. Clean up Lend Listings
    try:
        lend_res = supabase.table("lend_listings").select("*").lt("created_at", threshold).execute()
        for item in lend_res.data or []:
            image_url = item.get("image_url")
            if image_url:
                logger.info(f"Cleaning up Lend Listing image: {item['id']} ({item['title']})")
                success = await delete_supabase_image(image_url)
                if success:
                    # Update database
                    supabase.table("lend_listings").update({"image_url": None}).eq("id", item["id"]).execute()
                    stats["lend_listings_cleaned"] += 1
    except Exception as e:
        err_msg = f"Error during lend listings cleanup: {e}"
        logger.error(err_msg)
        stats["errors"].append(err_msg)
        
    end_time = datetime.now(timezone.utc)
    duration = (end_time - start_time).total_seconds()
    logger.info(f"Automatic cleanup job finished in {duration}s. Stats: {stats}")
    
    return {
        "status": "success",
        "started_at": start_time.isoformat(),
        "finished_at": end_time.isoformat(),
        "duration_seconds": duration,
        "stats": stats
    }
