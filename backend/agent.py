import random
from typing import Any, TypedDict

from duckduckgo_search import DDGS
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from schemas import StudyGuide
from config import OLLAMA_BASE_URL, TEXT_MODEL

llm = ChatOpenAI(
    base_url = OLLAMA_BASE_URL,
    api_key = "ollama",
    model = TEXT_MODEL,
    temperature = 0.2,
)

class AgentState(TypedDict):
    action: str
    context_data: Any
    study_guide: dict
    recommendations: dict
    chat_history: list
    user_query: str
    chat_response: str


def analyze_content_node(state: AgentState):
    num_questions = random.randint(5, 10)
    instruction = f"Analyze this educational content and generate a study guide. You MUST generate exactly {num_questions} quiz questions."

    structured_llm = llm.with_structured_output(StudyGuide)
    prompt = f"{instruction}\n\n{state['context_data']}"
    result = structured_llm.invoke(prompt)
    return {"study_guide": result.model_dump()}


def web_search_node(state: AgentState):
    topics = state["study_guide"]["topics"]
    recommendations = {}
    with DDGS() as ddgs:
        for topic in topics[:3]:
            try:
                results = list(ddgs.text(f"{topic} educational tutorial", max_results=2))
                recommendations[topic] = results
            except Exception:
                pass
    return {"recommendations": recommendations}


def _stringify_content(content: Any) -> str:
    """LangChain's AIMessage.content is typed as str | list[str | dict] some
    models emit multi-part responses (e.g. tool-call or reasoning segments)
    as a list, which must be flattened before it's sent to a client expecting
    a plain string."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for part in content:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict):
                parts.append(part.get("text", ""))
        return "".join(parts)
    return str(content)


def chat_node(state: AgentState):
    messages = [SystemMessage(content="You are an expert tutor. Answer questions based ONLY on the provided context material and history.")]
    messages.append(HumanMessage(content=f"Context Material:\n{state['context_data'][:20000]}"))

    for msg in state["chat_history"]:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))

    messages.append(HumanMessage(content=state["user_query"]))
    response = llm.invoke(messages)
    return {"chat_response": _stringify_content(response.content)}


def route_action(state: AgentState):
    if state["action"] == "analyze":
        return "analyze_node"
    elif state["action"] == "chat":
        return "chat_node"


builder = StateGraph(AgentState)
builder.add_node("analyze_node", analyze_content_node)
builder.add_node("search_node", web_search_node)
builder.add_node("chat_node", chat_node)

builder.set_conditional_entry_point(route_action, {"analyze_node": "analyze_node", "chat_node": "chat_node"})
builder.add_edge("analyze_node", "search_node")
builder.add_edge("search_node", END)
builder.add_edge("chat_node", END)
graph = builder.compile()
