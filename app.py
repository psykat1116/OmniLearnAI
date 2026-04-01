import streamlit as st
import os
import re
import requests
import tempfile
import zipfile
import random
import json
import shutil
import gdown
from dotenv import load_dotenv
import google.generativeai as genai
from typing import TypedDict, List
from pydantic import BaseModel, Field

from duckduckgo_search import DDGS
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from youtube_transcript_api import YouTubeTranscriptApi

st.set_page_config(page_title="OmniLearn AI", layout="wide")
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    st.error("GEMINI_API_KEY not found in .env file.")
    st.stop()

genai.configure(api_key=API_KEY)
llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", google_api_key=API_KEY, temperature=0.2)

class QuizQuestion(BaseModel):
    question: str = Field(description="The multiple choice question")
    options: List[str] = Field(description="Exactly 4 options")
    answer: str = Field(description="The exact text of the correct option")
    explanation: str = Field(description="Detailed explanation of why this answer is correct")

class StudyGuide(BaseModel):
    summary: str = Field(description="A 3-paragraph summary of the content")
    topics: List[str] = Field(description="List of 3 to 5 core topics extracted")
    quiz: List[QuizQuestion] = Field(description="The list of multiple choice questions")

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
                ext_map = {"PDF Document": ".pdf", "Audio File": ".mp3", "Image": ".png", "ZIP Archive": ".zip"}
                ext = ext_map.get(content_type, ".tmp")
                
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
                    gemini_file = genai.upload_file(tmp_path)
                    return gemini_file, None
                
        except Exception as e:
            return None, f"Drive Fetch Failed: {e}"

    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, stream=True)
        response.raise_for_status()

        ext_map = {"PDF Document": ".pdf", "Audio File": ".mp3", "Image": ".png", "ZIP Archive": ".zip"}
        ext = ext_map.get(content_type, ".tmp")
        
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
            gemini_file = genai.upload_file(tmp_path)
            return gemini_file, None
            
    except Exception as e:
        return None, f"Failed to fetch or process: {str(e)}"

class AgentState(TypedDict):
    action: str             
    context_data: any       
    study_guide: dict       
    recommendations: dict   
    chat_history: list      
    user_query: str         
    chat_response: str      

def analyze_content_node(state: AgentState):
    num_questions = random.randint(5, 10)
    instruction = f"Analyze this educational content and generate a study guide. You MUST generate exactly {num_questions} quiz questions."
    
    if isinstance(state['context_data'], str):
        structured_llm = llm.with_structured_output(StudyGuide)
        prompt = f"{instruction}\n\n{state['context_data']}"
        result = structured_llm.invoke(prompt)
        return {"study_guide": result.model_dump()}
        
    else:
        native_model = genai.GenerativeModel(
            'gemini-2.0-flash', 
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Stricter prompt to prevent markdown wrapping and unescaped quotes
        json_schema_prompt = instruction + """
        Return ONLY a valid JSON object matching this EXACT structure.
        CRITICAL: Do NOT wrap the response in markdown blocks like ```json.
        Ensure all internal quotation marks are properly escaped.
        {
          "summary": "A 3-paragraph summary.",
          "topics": ["Topic 1", "Topic 2", "Topic 3"],
          "quiz": [
            {
              "question": "Question text?",
              "options": ["A", "B", "C", "D"],
              "answer": "The exact correct option string",
              "explanation": "Why this is correct."
            }
          ]
        }
        """
        response = native_model.generate_content([json_schema_prompt, state['context_data']])
        
        # --- THE FIX: Robust JSON Cleaning ---
        raw_text = response.text.strip()
        
        # Strip markdown backticks if the model ignored instructions
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:]
            
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
            
        raw_text = raw_text.strip()
        
        try:
            return {"study_guide": json.loads(raw_text)}
        except json.JSONDecodeError as e:
            # If it STILL fails, give a clean error instead of crashing the app
            raise Exception(f"The AI generated malformed data for this image. Please click 'Fetch & Process' again to retry! (Dev Error: {e})")

def web_search_node(state: AgentState):
    topics = state["study_guide"]["topics"]
    recommendations = {}
    with DDGS() as ddgs:
        for topic in topics[:3]:
            try:
                results = list(ddgs.text(f"{topic} educational tutorial", max_results=2))
                recommendations[topic] = results
            except: pass
    return {"recommendations": recommendations}

def chat_node(state: AgentState):
    if isinstance(state['context_data'], str):
        messages = [SystemMessage(content="You are an expert tutor. Answer questions based ONLY on the provided context material and history.")]
        messages.append(HumanMessage(content=f"Context Material:\n{state['context_data'][:20000]}"))

        for msg in state["chat_history"]:
            if msg["role"] == "user": messages.append(HumanMessage(content=msg["content"]))
            else: messages.append(AIMessage(content=msg["content"]))
            
        messages.append(HumanMessage(content=state["user_query"]))
        response = llm.invoke(messages)
        return {"chat_response": response.content}
        
    else:
        native_model = genai.GenerativeModel('gemini-2.0-flash')
        chat_context = [
            "You are an expert tutor. Answer questions based ONLY on this provided file and our chat history.",
            state['context_data']
        ]
        
        for msg in state["chat_history"]:
            chat_context.append(f"{msg['role'].capitalize()}: {msg['content']}")
            
        chat_context.append(f"User: {state['user_query']}")
        response = native_model.generate_content(chat_context)
        return {"chat_response": response.text}

def route_action(state: AgentState):
    if state["action"] == "analyze": return "analyze_node"
    elif state["action"] == "chat": return "chat_node"

builder = StateGraph(AgentState)
builder.add_node("analyze_node", analyze_content_node)
builder.add_node("search_node", web_search_node)
builder.add_node("chat_node", chat_node)

builder.set_conditional_entry_point(route_action, {"analyze_node": "analyze_node", "chat_node": "chat_node"})
builder.add_edge("analyze_node", "search_node")
builder.add_edge("search_node", END)
builder.add_edge("chat_node", END)
graph = builder.compile()

st.title("OmniLearn AI")

if "app_state" not in st.session_state:
    st.session_state.app_state = {
        "action": "", "context_data": None, "study_guide": None, 
        "recommendations": {}, "chat_history": [], "user_query": "", "chat_response": ""
    }

with st.sidebar:
    st.header("Data Ingestion")
    content_types = ["PDF Document", "YouTube Video", "Audio File", "Image", "ZIP Archive"]
    selected_type = st.selectbox("Select Content Type", content_types)
    source_url = st.text_input("Enter Source URL")
    
    trigger_analysis = False
    
    if st.button("Fetch & Process") and source_url:
        with st.spinner(f"Fetching {selected_type}..."):
            data, error = fetch_from_url(source_url, selected_type)
            if error:
                st.error(error)
            else:
                st.session_state.app_state["context_data"] = data
                st.session_state.app_state["chat_history"] = []
                trigger_analysis = True
                st.success("File fetched successfully!")

    if trigger_analysis:
        with st.spinner("Agent is extracting insights and building your study guide..."):
            st.session_state.app_state["action"] = "analyze"
            final_state = graph.invoke(st.session_state.app_state)
            st.session_state.app_state.update(final_state)

if st.session_state.app_state.get("study_guide"):
    sg = st.session_state.app_state["study_guide"]
    tab1, tab2, tab3 = st.tabs(["Study Guide", "Quiz", "Chat"])
    
    with tab1:
        col1, col2 = st.columns([2, 1])
        with col1:
            st.subheader("Content Summary")
            st.write(sg["summary"])
        with col2:
            st.subheader("Expand Your Knowledge")
            recs = st.session_state.app_state.get("recommendations", {})
            for topic, links in recs.items():
                with st.expander(f"Learn about: {topic}"):
                    for link in links:
                        st.markdown(f"- [{link['title']}]({link['href']})")

    with tab2:
        st.subheader(f"Test Your Comprehension ({len(sg['quiz'])} Questions)")
        
        with st.form("quiz_form"):
            user_answers = {}
            for i, q in enumerate(sg["quiz"]):
                st.markdown(f"**Q{i+1}: {q['question']}**")
                user_answers[i] = st.radio("Select an answer:", q["options"], key=f"q_{i}", index=None)
                st.markdown("---")
            
            submitted = st.form_submit_button("Submit Quiz")
            
        if submitted:
            score = sum(1 for i, q in enumerate(sg["quiz"]) if user_answers[i] == q["answer"])
            st.success(f"Your Score: {score} / {len(sg['quiz'])}")
            
            st.subheader("Review Your Answers")
            for i, q in enumerate(sg["quiz"]):
                with st.expander(f"Q{i+1} Review"):
                    if user_answers[i] == q["answer"]:
                        st.write("Correct!")
                    else:
                        st.write(f"Incorrect. You chose: _{user_answers[i]}_")
                        st.write(f"**Correct Answer:** {q['answer']}")
                    st.info(f"**Explanation:** {q['explanation']}")

    with tab3:
        st.subheader("Ask the Tutor")
        
        # Borderless container with ample height for clean scrolling
        chat_container = st.container(height=500, border=False)
        
        with chat_container:
            for msg in st.session_state.app_state["chat_history"]:
                with st.chat_message(msg["role"]): 
                    st.markdown(msg["content"])

        if prompt := st.chat_input("Ask a question about the material..."):
            with chat_container:
                with st.chat_message("user"): 
                    st.markdown(prompt)
            
            st.session_state.app_state["action"] = "chat"
            st.session_state.app_state["user_query"] = prompt
            
            with chat_container:
                with st.chat_message("assistant"):
                    with st.spinner("Thinking..."):
                        new_state = graph.invoke(st.session_state.app_state)
                        response_text = new_state["chat_response"]
                        st.markdown(response_text)
                        
                        st.session_state.app_state["chat_history"].append({"role": "user", "content": prompt})
                        st.session_state.app_state["chat_history"].append({"role": "assistant", "content": response_text})

else:
    st.markdown("---")
    st.markdown(
        """
        # Welcome to OmniLearn AI
        ### Your Intelligent Multimodal Learning Assistant
        
        OmniLearn AI transforms any content into a structured, interactive learning experience. Drop in a link and let the agent do the heavy lifting.
        
        #### How it works:
        1. **Select Content Type:** Choose from YouTube Videos, PDF Documents, Audio Files, Images, or ZIP Archives in the sidebar.
        2. **Provide Source URL:** Paste the link to your educational content.
        3. **Learn & Test:** Instantly receive a detailed summary, explore recommended web resources, take a dynamically generated quiz, and interact with an AI tutor who knows the material inside and out.
        
        **To get started, use the Data Ingestion panel on the left.**
        """
    )