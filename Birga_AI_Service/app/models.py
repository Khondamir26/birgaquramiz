from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class InputOption(BaseModel):
    label: str
    value: str


class InputRequest(BaseModel):
    type: Literal["number", "select", "text"]
    field: str
    label: str
    unit: Optional[str] = None
    quickValues: Optional[list[int]] = None
    options: Optional[list[InputOption]] = None


class AiMaterial(BaseModel):
    name: str
    quantity: str
    unit: str
    reason: str


class AiProduct(BaseModel):
    id: Optional[str] = None
    slug: str
    name: str
    price: str
    imageUrl: Optional[str] = None
    reason: str
    quantity: Optional[int] = None
    inStock: Optional[bool] = None
    stockCount: Optional[int] = None


class AiAction(BaseModel):
    type: str
    label: str


class AiStructuredResponse(BaseModel):
    message: str
    materials: list[AiMaterial] = []
    products: list[AiProduct] = []
    actions: list[AiAction] = []
    suggestions: list[str] = []
    inputRequest: Optional[InputRequest] = None
    remaining: Optional[int] = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    locale: Optional[str] = "ru"
    projectContext: Optional[dict] = None
    sessionId: Optional[str] = None
