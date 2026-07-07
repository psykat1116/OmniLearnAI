from typing import Any, Dict
from fastapi import HTTPException
from extraction import fetch_from_url

# Content is re-derived per source_url on chat requests since HTTP is
# stateless; cache it so re-fetching (e.g. re-downloading a PDF) only
# happens once per source per server run.
_content_cache: Dict[str, Any] = {}

def cache_key(url: str, content_type: str) -> str:
    return f"{content_type}::{url}"

def store(url: str, content_type: str, data: Any) -> None:
    _content_cache[cache_key(url, content_type)] = data

def get_context(url: str, content_type: str) -> Any:
    key = cache_key(url, content_type)
    if key not in _content_cache:
        if url.startswith("upload:"):
            # Uploaded files have no URL to re-fetch from; the cache entry
            # only ever existed in this server process's memory.
            raise HTTPException(
                status_code=400,
                detail="This uploaded file is no longer available (the server may have restarted). Please re-upload it.",
            )
        data, error = fetch_from_url(url, content_type)
        if error:
            raise HTTPException(status_code=400, detail=error)
        _content_cache[key] = data
    return _content_cache[key]
