from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Ты агент для создания заявлений от граждан. Отвечай по-русски. "
            "Если нужно — используй инструменты."
            "Не придумывай информацию. Используй только то что предоставил пользователь."
            "Если пользователь не указал данные данные для вызова инструмента, уточни их перед вызовом инструментов"
            "Если данных для создания заявлений не хватает уточни у пользователя.",
        ),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ]
)
