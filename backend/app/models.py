from typing import Literal

from pydantic import BaseModel, Field


class RatedItem(BaseModel):
    title: str
    rating: float = Field(ge=0, le=5)
    review: str = ""


class RecommendRequest(BaseModel):
    mood: str = ""
    ratings: list[RatedItem] = Field(default_factory=list)


class CsvRecommendRequest(BaseModel):
    mood: str = ""
    csv_content: str = Field(min_length=1)


class Recommendation(BaseModel):
    id: int | None = None
    title: str
    year: int
    kind: str
    why: str
    match_score: int
    tags: list[str]


class RecommendResponse(BaseModel):
    taste_summary: str
    recommendations: list[Recommendation]


class UserCredentials(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=200)


class AuthResponse(BaseModel):
    token: str
    username: str


class FeedbackRequest(BaseModel):
    recommendation_id: int
    status: Literal["interested", "not_interested", "seen"]
