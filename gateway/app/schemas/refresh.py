from pydantic import BaseModel


class RefreshRequest(BaseModel):
    fingerprint: str


class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
