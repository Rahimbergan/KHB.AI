from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ArtifactResponse(BaseModel):
    id: str
    type: str = Field(..., description="metric|table|bar_chart|line_chart|pie_chart|markdown|report|document_extract")
    title: str
    description: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    config: Dict[str, Any] = Field(default_factory=dict)
    source_ids: List[str] = Field(default_factory=list)
    created_at: Optional[str] = None

