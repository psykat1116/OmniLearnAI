import type {
  StudyGuide,
  ContentType,
  ChatMessage,
  Recommendations,
} from "./types";

const API_BASE = "http://localhost:8000";

export async function analyzeContent(
  url: string,
  contentType: ContentType,
): Promise<{ study_guide: StudyGuide; recommendations: Recommendations }> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, content_type: contentType }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function analyzeUpload(
  file: File,
  contentType: ContentType,
): Promise<{
  study_guide: StudyGuide;
  recommendations: Recommendations;
  source_id: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("content_type", contentType);

  const res = await fetch(`${API_BASE}/api/analyze/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function sendChatMessage(
  query: string,
  chatHistory: ChatMessage[],
  sourceUrl: string,
  contentType: ContentType,
): Promise<{ response: string }> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      source_url: sourceUrl,
      content_type: contentType,
      chat_history: chatHistory,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return res.json();
}
