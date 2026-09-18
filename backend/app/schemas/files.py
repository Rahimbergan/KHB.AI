from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    created_at: str


class FileDetailResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    extracted_text_preview: Optional[str] = None
    extracted_text: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


class FileAnalyzeRequest(BaseModel):
    prompt: Optional[str] = "Summarize this document, identify parties, dates, amounts, obligations, deadlines, and potential risks."
    mode: str = "general"  # general, contract, invoice, receipt, legal


class FileAnalysisResponse(BaseModel):
    file_id: str
    filename: str
    summary: str
    parties: List[str] = Field(default_factory=list)
    dates: List[str] = Field(default_factory=list)
    amounts: List[str] = Field(default_factory=list)
    obligations: List[str] = Field(default_factory=list)
    deadlines: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    simple_explanation: str
    disclaimer: str

