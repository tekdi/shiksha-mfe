import asyncio
import os
import sys

# Add the app directory to sys.path
sys.path.append(os.path.abspath('/home/ash/Open-Source/shiksha-mfe/ai-gateway'))

# Mock settings before importing llm_client
from app.core.config import settings
settings.mock_mode = True

from app.services.llm_client import llm_client

async def test_overlap_responses():
    prompts = [
        # This contains "lesson" but should return takeaways/glossary because they are prioritized
        "Analyze this text from Lesson 1 and provide key takeaways and a glossary.",
        "Summarize the content of these slides.",
        "Generate 4 lesson slides about photosynthesis."
    ]
    
    for prompt in prompts:
        print(f"\n--- Testing Prompt: {prompt} ---")
        result = await llm_client.generate_json(prompt)
        print(f"Result Keys: {list(result.keys())}")
        if 'takeaways' in result:
            print("Successfully returned Takeaways.")
        if 'summary' in result:
            print("Successfully returned Summary.")
        if 'slides' in result:
            print("Successfully returned Slides.")

if __name__ == "__main__":
    asyncio.run(test_overlap_responses())
