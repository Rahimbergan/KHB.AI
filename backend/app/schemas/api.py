from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int = Field(1, ge=1, description="Current page number")
    page_size: int = Field(50, ge=1, le=1000, description="Items per page")
    total: int = Field(0, ge=0, description="Total items matching query")
    pages: int = Field(0, ge=0, description="Total pages")


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T] = Field(default_factory=list, description="Page items")
    pagination: PaginationMeta


class APIError(BaseModel):
    error: str
    detail: str
    request_id: Optional[str] = None

