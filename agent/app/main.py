from fastapi import FastAPI
from app.config import router_rabbitmq
from app.broker.consumer import consumer_text

app = FastAPI()

app.include_router(router_rabbitmq)
# from fastapi import FastAPI, Form

# from app.tools_calling_agent.main import create_agent


# app = FastAPI()


# @app.post("/")
# async def send_agent(text: str = Form(...)):
#     agent = await create_agent()
#     response = agent.invoke({"input": text})
#     return response.get("output")
