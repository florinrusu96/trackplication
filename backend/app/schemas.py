import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Status = Literal["Applied", "Interviewing", "Offer", "Rejected", "Ghosted"]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr


class TokenResponse(BaseModel):
    token: str
    user: UserOut


class ExtractedApplication(BaseModel):
    """Shape the LLM extracts and the chat confirm-card submits."""

    company: str
    role: str
    location: str | None = None
    salary_text: str | None = None
    source: str | None = None
    url: str | None = None
    requirements: list[str] = Field(default_factory=list)


class ExtractRequest(BaseModel):
    text: str = Field(min_length=1)


class ApplicationCreate(ExtractedApplication):
    status: Status = "Applied"
    notes: str = ""
    applied_at: date | None = None
    raw_input: str | None = None


class ApplicationUpdate(BaseModel):
    company: str | None = None
    role: str | None = None
    location: str | None = None
    salary_text: str | None = None
    status: Status | None = None
    source: str | None = None
    url: str | None = None
    requirements: list[str] | None = None
    notes: str | None = None
    applied_at: date | None = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company: str
    role: str
    location: str | None
    salary_text: str | None
    status: Status
    source: str | None
    url: str | None
    requirements: list[str]
    notes: str
    applied_at: date
    created_at: datetime
    updated_at: datetime
