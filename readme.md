# 🧠 OmniLearn AI

**OmniLearn AI** is an intelligent, agentic learning assistant that transforms raw content into a comprehensive, interactive educational experience. 

Simply provide a link to a YouTube video, a PDF document, a ZIP archive, or a Google Drive folder, and the system automatically ingests the content to generate a structured study guide, curate web recommendations, build an interactive self-assessment quiz, and deploy a context-aware AI tutor to answer follow-up questions.

---

## Key Features
* **Universal Content Ingestion:** Seamlessly extracts text from YouTube transcripts, direct web downloads, Google Drive links (both single files and full folders), local PDFs, and ZIP archives containing code or text.
* **Agentic Study Guide Generation:** Automatically synthesizes complex material into a concise summary and extracts core concepts.
* **Automated Web Research:** Dynamically searches the web (via DuckDuckGo) to recommend additional, highly relevant tutorials and articles based on the extracted topics.
* **Interactive Batch-Scored Quizzes:** Generates a dynamic multiple-choice quiz (5-10 questions) with instant grading and detailed, empathetic explanations for correct and incorrect answers.
* **Context-Aware AI Tutor:** A sticky, chat-based interface that retains conversational memory and grounds all answers strictly within the provided source material.

---

## System Architecture

OmniLearn AI is powered by **LangGraph** for robust state management and **LangChain** for LLM orchestration, utilizing **OpenRouter** (running Meta's `Llama-3.3-70B-Instruct`) as the core cognitive engine.

### 1. The Ingestion Engine
The `fetch_from_url` pipeline acts as the primary data router:
* **YouTube:** Uses `youtube-transcript-api` to bypass video downloading and directly parse timestamps and text.
* **Google Drive:** Uses `gdown` to bypass Google's virus-scan warning screens, downloading folders and files directly into temporary memory.
* **PDFs & ZIPs:** Uses `PyPDF2` and native `zipfile` libraries to locally extract raw text and code before injecting it into the LLM context window.

### 2. LangGraph State Machine
The application logic is driven by a directed acyclic graph (DAG) defined by LangGraph, passing an `AgentState` dictionary between specialized nodes:
* **`analyze_content_node`:** Takes the raw extracted text and forces the LLM to map its output to a strict **Pydantic Schema**. This guarantees valid JSON output containing the summary, topics, and quiz questions.
* **`search_node`:** Takes the extracted topics and triggers a localized DuckDuckGo web search to fetch supplemental learning materials.
* **`chat_node`:** Injects the entire conversational history and the original document context into the LLM payload, acting as a Retrieval-Augmented Generation (RAG) tutor.

### 3. Streamlit UI
A completely reactive, single-page application built with Streamlit. It features state preservation (`st.session_state`), form-based batch submission for the quiz, and a custom CSS-styled fixed container for the chat interface.

---

## Tech Stack
* **Frontend UI:** Streamlit
* **Agentic Framework:** LangChain & LangGraph
* **Google API:** gemini-2.5-flash
* **Data Validation:** Pydantic
* **Web Search:** DuckDuckGo Search (`duckduckgo-search`)
* **Content Extraction:** `PyPDF2`, `youtube-transcript-api`, `requests`, `gdown`

---

## Installation & Setup

### Prerequisites
You will need Python 3.9+ installed on your machine.
- ```bash
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
  ```

### Environmental File
- ```
    GEMINI_API_KEY = ""
  ```


### 1. Clone the repository
```bash
git clone [https://github.com/psykat1116/OmniLearnAI.git](https://github.com/psykat1116/OmniLearnAI)
cd OmniLearnAI