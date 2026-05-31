from pydantic import BaseModel, Field


class ProducerSendNotification(BaseModel):
    user_id: int
    text: str
