import google.generativeai as genai
from config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

MODELS = ["gemini-2.5-pro"]

async def generate_chat_response(user_message: str, system_prompt: str = None) -> str:
    for model_name in MODELS:
        try:
            model = genai.GenerativeModel(model_name, system_instruction=system_prompt)
            response = model.generate_content(user_message)
            return response.text
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                continue
            raise e
    return "I'm currently experiencing high demand. Please try again later or book an appointment."