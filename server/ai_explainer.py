import os
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")

def explain_incident(context: str) -> str:
    response = client.chat.completions.create(
        model=DEPLOYMENT,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an experienced Site Reliability Engineer. "
                    "Analyze incidents based on observability data."
                )
            },
            {
                "role": "user",
                "content": f"""
Given the incident context below:

{context}

Please provide:
1. What happened
2. Likely root cause
3. Immediate mitigation steps
4. Long-term preventive actions
"""
            }
        ],
        temperature=0.2,
        max_tokens=350
    )

    return response.choices[0].message.content

