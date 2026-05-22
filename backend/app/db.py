from supabase import create_client, Client
from postgrest._sync.request_builder import SyncMaybeSingleRequestBuilder
from postgrest.base_request_builder import SingleAPIResponse
import os

# Patch SyncMaybeSingleRequestBuilder to return SingleAPIResponse(data=None) instead of None when 0 rows are found
original_execute = SyncMaybeSingleRequestBuilder.execute

def patched_execute(self, *args, **kwargs):
    res = original_execute(self, *args, **kwargs)
    if res is None:
        return SingleAPIResponse(data=None, count=None)
    return res

SyncMaybeSingleRequestBuilder.execute = patched_execute

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

