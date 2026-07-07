import uuid
import cache
from typing import Any, Dict
from agent import AgentState, graph
from config import UPLOADABLE_TYPES
from schemas import AnalyzeRequest, ChatRequest
from extraction import fetch_from_url, process_uploaded_file
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

router = APIRouter()
def _run_analysis(data: Any) -> Dict[str, Any]:
    state: AgentState = {
        "action": "analyze",
        "context_data": data,
        "study_guide": {},
        "recommendations": {},
        "chat_history": [],
        "user_query": "",
        "chat_response": "",
    }
    result = graph.invoke(state)
    return {
        "study_guide": result["study_guide"],
        "recommendations": result.get("recommendations", {}),
    }


@router.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    data, error = fetch_from_url(req.url, req.content_type)
    if error:
        raise HTTPException(status_code=400, detail=error)
    cache.store(req.url, req.content_type, data)
    return _run_analysis(data)


@router.post("/api/analyze/upload")
async def analyze_upload(file: UploadFile = File(...), content_type: str = Form(...)):
    if content_type not in UPLOADABLE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Direct upload isn't supported for '{content_type}'. Use a source URL instead.",
        )

    file_bytes = await file.read()
    data, error = await run_in_threadpool(process_uploaded_file, file_bytes, content_type)
    if error:
        raise HTTPException(status_code=400, detail=error)

    source_id = f"upload:{uuid.uuid4()}"
    cache.store(source_id, content_type, data)

    analysis = await run_in_threadpool(_run_analysis, data)
    return {**analysis, "source_id": source_id}


@router.post("/api/chat")
def chat(req: ChatRequest):
    context_data = cache.get_context(req.source_url, req.content_type)

    state: AgentState = {
        "action": "chat",
        "context_data": context_data,
        "study_guide": {},
        "recommendations": {},
        "chat_history": [m.model_dump() for m in req.chat_history],
        "user_query": req.query,
        "chat_response": "",
    }

    result = graph.invoke(state)
    return {"response": result["chat_response"]}


@router.get("/api/health")
def health():
    return {"status": "ok"}
