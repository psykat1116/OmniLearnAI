import os
from typing import Literal
from dotenv import load_dotenv

load_dotenv()

WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "auto")
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL", "small")
VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "qwen2.5vl:3b")
TEXT_MODEL = os.getenv("OLLAMA_TEXT_MODEL", "qwen2.5:7b-instruct")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")

ContentType = Literal[
    "PDF Document", 
    "YouTube Video", 
    "Audio File", 
    "Image", 
    "ZIP Archive"
]
UPLOADABLE_TYPES = {"PDF Document", "Audio File", "Image"}
EXT_MAP = {"PDF Document": ".pdf", "Audio File": ".mp3", "Image": ".png", "ZIP Archive": ".zip"}

CORS_ORIGINS = [
    "http://localhost:5173", 
    "http://127.0.0.1:5173"
]