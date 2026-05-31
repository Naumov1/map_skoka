from app.core.create_llm import llm
from app.tools_calling_agent.tools import tools
from app.tools_calling_agent.prompt import prompt
from langchain.agents import create_tool_calling_agent, AgentExecutor


async def create_agent():
    agent = create_tool_calling_agent(llm=llm, tools=tools, prompt=prompt)
    agent_executer = AgentExecutor(
        name="CreateApplications",
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True,
        max_iterations=10,
    )
    return agent_executer
