from typing import TypedDict
from langgraph.graph import StateGraph


class State(TypedDict):
    tg_id: int
    input_messages: str
    templates_data: str
    output_messages: str
    await_response: str


graph_builder = StateGraph(State)
