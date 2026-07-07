from config import ContentType
from typing import List, Literal
from pydantic import BaseModel, Field

class QuizQuestion(BaseModel):
    question: str = Field(description="The multiple choice question")
    options: List[str] = Field(description="Exactly 4 options")
    answer: str = Field(description="The exact text of the correct option")
    explanation: str = Field(description="Detailed explanation of why this answer is correct")

class StudyGuide(BaseModel):
    summary: str = Field(description="A 3-paragraph summary of the content")
    topics: List[str] = Field(description="List of 3 to 5 core topics extracted")
    quiz: List[QuizQuestion] = Field(description="The list of multiple choice questions")

class AnalyzeRequest(BaseModel):
    url: str
    content_type: ContentType

class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    query: str
    source_url: str
    content_type: ContentType
    chat_history: List[ChatMessageIn] = []
