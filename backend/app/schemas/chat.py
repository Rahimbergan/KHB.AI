from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.artifacts import ArtifactResponse


class MessageContext(BaseModel):
    date: Optional[str] = None
    dashboard_filters: Dict[str, Any] = Field(default_factory=dict)


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1)
    attachment_ids: List[str] = Field(default_factory=list)
    context: Optional[MessageContext] = None


class MessageItem(BaseModel):
    id: str
    role: str
    content: str
    created_at: str


class ChatUsage(BaseModel):
    used_claude: bool = False
    model: Optional[str] = None
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None


class ChatResponse(BaseModel):
    message: MessageItem
    artifacts: List[ArtifactResponse] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    usage: ChatUsage = Field(default_factory=ChatUsage)


class ConversationCreateRequest(BaseModel):
    title: Optional[str] = "New Conversation"


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str


class ConversationDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[Dict[str, Any]] = Field(default_factory=list)

