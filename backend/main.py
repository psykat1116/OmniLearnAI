from fastapi import FastAPI, HTTPException
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware

from routes import router
from config import CORS_ORIGINS

app = FastAPI(title="OmniLearn AI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return PlainTextResponse(str(exc.detail), status_code=exc.status_code)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc: Exception):
    return PlainTextResponse(str(exc), status_code=500)
