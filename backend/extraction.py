import os
import re
import base64
import shutil
import zipfile
import tempfile

import fitz
import gdown
import requests
from faster_whisper import WhisperModel
from youtube_transcript_api import YouTubeTranscriptApi

from config import EXT_MAP, OLLAMA_BASE_URL, VISION_MODEL, WHISPER_DEVICE, WHISPER_MODEL_SIZE

# --- Local multimodal extraction -----------------------------------------
# A cloud multimodal API could natively read a PDF/image/audio file in one
# call. A local text-only SLM can't, so each content type is converted to
# plain text *before* it ever reaches the LLM: PDFs via direct text
# extraction (no GPU needed), audio via Whisper transcription, images via a
# small vision model served alongside the text model in Ollama.

_whisper_model = None

def _get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = WhisperModel(WHISPER_MODEL_SIZE, device=WHISPER_DEVICE, compute_type="int8")
        
    return _whisper_model


def _extract_pdf_text(path: str) -> str:
    doc = fitz.open(path)
    try:
        return "\n".join(page.get_text() for page in doc)
    finally:
        doc.close()


def _transcribe_audio(path: str) -> str:
    segments, _ = _get_whisper_model().transcribe(path)
    return " ".join(segment.text.strip() for segment in segments)


def _describe_image(path: str) -> str:
    with open(path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode("utf-8")

    ollama_host = OLLAMA_BASE_URL.removesuffix("/v1")
    resp = requests.post(
        f"{ollama_host}/api/generate",
        json={
            "model": VISION_MODEL,
            "prompt": (
                "Describe this image in detail for a study guide. Transcribe any "
                "readable text verbatim, and describe diagrams, charts, or "
                "illustrations thoroughly enough that someone who can't see the "
                "image could still learn from it."
            ),
            "images": [image_b64],
            "stream": False,
        },
        timeout=180,
    )
    resp.raise_for_status()
    return resp.json()["response"]


def _extract_local_file(tmp_path: str, content_type: str):
    """Turns a downloaded/uploaded local file into plain text, or returns
    an error tuple. Always deletes the temp file before returning."""
    try:
        if content_type == "PDF Document":
            return _extract_pdf_text(tmp_path), None
        elif content_type == "Audio File":
            return _transcribe_audio(tmp_path), None
        elif content_type == "Image":
            return _describe_image(tmp_path), None
        else:
            return None, f"Unsupported content type for local extraction: {content_type}"
    except Exception as e:
        return None, f"Failed to process {content_type}: {e}"
    finally:
        os.remove(tmp_path)


def fetch_from_url(url, content_type):
    """Downloads the file from the URL or extracts YouTube transcripts."""
    if content_type == "YouTube Video":
        try:
            vid_id = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url).group(1)
            yt_api = YouTubeTranscriptApi()
            transcript = yt_api.fetch(vid_id)
            return " ".join([t.text for t in transcript]), None
        except Exception as e:
            return None, f"YouTube extraction failed: {e}"

    if "drive.google.com" in url:
        try:
            if "/folders/" in url:
                folder_id_match = re.search(r"/folders/([a-zA-Z0-9_-]+)", url)
                if not folder_id_match:
                    return None, "Invalid Google Drive Folder URL."

                folder_id = folder_id_match.group(1)
                tmp_dir = tempfile.mkdtemp()

                gdown.download_folder(id=folder_id, output=tmp_dir, quiet=False, remaining_ok=True)

                extracted_text = "--- DRIVE FOLDER CONTENTS ---\n"
                for root, dirs, files in os.walk(tmp_dir):
                    for file in files:
                        if file.endswith(('.txt', '.md', '.csv', '.json', '.py', '.js', '.html')):
                            file_path = os.path.join(root, file)
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                                extracted_text += f"\n--- {file} ---\n{f.read()}\n"

                shutil.rmtree(tmp_dir)
                if extracted_text == "--- DRIVE FOLDER CONTENTS ---\n":
                    return None, "Folder downloaded, but no readable text/code files were found inside."

                return extracted_text, None

            else:
                ext = EXT_MAP.get(content_type, ".tmp")

                with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
                    tmp_path = tmp_file.name

                file_id_match = re.search(r"/file/d/([a-zA-Z0-9_-]+)", url) or re.search(r"id=([a-zA-Z0-9_-]+)", url)
                if not file_id_match:
                    return None, "Could not find a valid Google Drive File ID."

                file_id = file_id_match.group(1)
                gdown.download(id=file_id, output=tmp_path, quiet=False)

                if os.path.getsize(tmp_path) < 10000:
                    os.remove(tmp_path)
                    return None, "Drive Error: Google blocked the download. Ensure sharing is 'Anyone with link can view'."

                if content_type == "ZIP Archive":
                    extracted_text = "--- ZIP CONTENTS ---\n"
                    with zipfile.ZipFile(tmp_path, 'r') as z:
                        for filename in z.namelist():
                            if not filename.startswith('__MACOSX') and filename.endswith(('.txt', '.md', '.csv', '.json', '.py', '.js', '.html')):
                                with z.open(filename) as f:
                                    extracted_text += f"\n--- {filename} ---\n{f.read().decode('utf-8', errors='ignore')}"
                    os.remove(tmp_path)
                    return extracted_text, None
                else:
                    return _extract_local_file(tmp_path, content_type)
        except Exception as e:
            return None, f"Drive Fetch Failed: {e}"

    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, stream=True)
        response.raise_for_status()

        ext = EXT_MAP.get(content_type, ".tmp")

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
            for chunk in response.iter_content(chunk_size=8192):
                tmp_file.write(chunk)
            tmp_path = tmp_file.name

        if content_type == "ZIP Archive":
            extracted_text = "--- ZIP CONTENTS ---\n"
            try:
                with zipfile.ZipFile(tmp_path, 'r') as z:
                    for filename in z.namelist():
                        if not filename.startswith('__MACOSX') and filename.endswith(('.txt', '.md', '.csv', '.json', '.py', '.js', '.html')):
                            with z.open(filename) as f:
                                extracted_text += f"\n--- {filename} ---\n{f.read().decode('utf-8', errors='ignore')}"
                os.remove(tmp_path)
                return extracted_text, None
            except zipfile.BadZipFile:
                os.remove(tmp_path)
                return None, "Drive Error: The downloaded file is not a valid ZIP. Google Drive likely blocked the download with a virus scan warning, or the file type is incorrect."
        else:
            return _extract_local_file(tmp_path, content_type)

    except Exception as e:
        return None, f"Failed to fetch or process: {str(e)}"


def process_uploaded_file(file_bytes: bytes, content_type: str):
    """Same PDF/Audio/Image handling as fetch_from_url's download path,
    but for bytes already received from the client instead of a URL."""
    ext = EXT_MAP.get(content_type, ".tmp")
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
        tmp_file.write(file_bytes)
        tmp_path = tmp_file.name

    return _extract_local_file(tmp_path, content_type)
