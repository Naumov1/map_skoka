from pydantic import BaseModel, Field


class SAddSignature(BaseModel):
    conclusion_id: int = Field(...)