import os
import json
import base64

from dotenv import load_dotenv
from groq import Groq
from bson import ObjectId

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is missing.")

client = Groq(api_key=GROQ_API_KEY)


# =========================================================
# AI PRIORITIZATION
# =========================================================

def prioritize_tickets(tickets):

    if not tickets:
        return []

    ticket_data = []

    for ticket in tickets:
        ticket_data.append({
            "ticket_id": str(ticket["_id"]),
            "title": ticket.get("title", ""),
            "description": ticket.get("description", ""),
            "category": ticket.get("category", "")
        })

    prompt = f"""
You are an AI support-ticket triage assistant.

Analyze the following support tickets.

For each ticket return:
- ticket_id
- priority: one of "low", "medium", "high", "critical"
- category: one of "technical", "billing", "account", "security", "general"
- reason: a short explanation

Return ONLY valid JSON.

Expected format:

{{
    "tickets": [
        {{
            "ticket_id": "string",
            "priority": "high",
            "category": "technical",
            "reason": "Short explanation"
        }}
    ]
}}

Tickets:

{json.dumps(ticket_data, indent=2)}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": "You classify support tickets and return valid JSON only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1,
    )

    content = response.choices[0].message.content

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        raise ValueError("AI returned invalid JSON.")

    return result.get("tickets", [])

    # =========================================================
# AI TICKET SUMMARY
# =========================================================

def summarize_ticket(title, description, comments):

    comment_text = ""

    for comment in comments:
        comment_text += (
            f"{comment.get('role', 'user')}: "
            f"{comment.get('content', '')}\n"
        )

    prompt = f"""
You are an AI support-ticket assistant.

Summarize the following support ticket.

Return ONLY valid JSON using exactly this format:

{{
    "summary": "3-4 concise lines covering the problem, what has been tried, and what is still outstanding."
}}

Ticket title:
{title}

Ticket description:
{description}

Comments:
{comment_text}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": "You summarize support tickets and return valid JSON only."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1,
    )

    content = response.choices[0].message.content

    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        raise ValueError("AI returned invalid JSON.")

    return result

# =========================================================
# AI SCREENSHOT ERROR EXTRACTION
# =========================================================

def extract_error_from_image(image_path, content_type):
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(
            image_file.read()
        ).decode("utf-8")

    prompt = """
Analyze this screenshot as a technical support-ticket image.

You MUST carefully read all visible text in the image.

Look specifically for:
- HTTP status codes such as 404, 400, 401, 403, 500
- error messages
- exception messages
- warning messages
- error codes
- failed request messages
- stack traces
- technical details
- browser/application error messages

If an error is visible, extract it exactly or as accurately as possible.

For example, if the screenshot shows:

404
This page could not be found.

then return:

{
    "error_text": "404 - This page could not be found.",
    "technical_details": "HTTP 404 Not Found. The requested page or route could not be found."
}

Do NOT return empty strings when an obvious error or status code is visible.

Return ONLY valid JSON in exactly this format:

{
    "error_text": "error or status message",
    "technical_details": "technical explanation"
}

If there genuinely is no visible error, return:

{
    "error_text": "",
    "technical_details": ""
}
"""

    response = client.chat.completions.create(
        model="qwen/qwen3.6-27b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a technical support screenshot "
                    "analyzer. Read visible text carefully, "
                    "identify errors and HTTP status codes, "
                    "and return only valid JSON."
                )
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": (
                                f"data:{content_type};"
                                f"base64,{base64_image}"
                            )
                        }
                    }
                ]
            }
        ],
        temperature=0,
        reasoning_effort="none",
        max_completion_tokens=500,
        response_format={
            "type": "json_object"
        }
    )

    content = response.choices[0].message.content

    print("AI IMAGE EXTRACTION RESPONSE:")
    print(content)

    try:
        result = json.loads(content)

        return {
            "error_text": result.get("error_text", ""),
            "technical_details": result.get(
                "technical_details",
                ""
            )
        }

    except json.JSONDecodeError:
        raise ValueError(
            "AI returned invalid JSON."
        )