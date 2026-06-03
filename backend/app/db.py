import os
from supabase import create_client, Client
from postgrest._sync.request_builder import SyncMaybeSingleRequestBuilder
from postgrest.base_request_builder import SingleAPIResponse

# Patch SyncMaybeSingleRequestBuilder to return SingleAPIResponse(data=None) instead of None when 0 rows are found
original_execute = SyncMaybeSingleRequestBuilder.execute

def patched_execute(self, *args, **kwargs):
    res = original_execute(self, *args, **kwargs)
    if res is None:
        return SingleAPIResponse(data=None, count=None)
    return res

SyncMaybeSingleRequestBuilder.execute = patched_execute

# Module-level variable to store the initialized client instance
_supabase_client = None

def __getattr__(name: str):
    """
    Python 3.7+ module-level attribute getter.
    Enables lazy-loading of the 'supabase' client on first access inside a serverless container.
    """
    if name == "supabase":
        global _supabase_client
        if _supabase_client is None:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_KEY")
            if not url or not key:
                raise RuntimeError("Supabase credentials (SUPABASE_URL/SUPABASE_SERVICE_KEY) are not configured!")
            
            # PostgREST Client initialization (Pure HTTP API, no direct TCP pool)
            _supabase_client = create_client(url, key)
        return _supabase_client
    raise AttributeError(f"module {__name__} has no attribute {name}")
