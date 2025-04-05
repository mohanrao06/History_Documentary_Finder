import google.generativeai as genai

GEMINI_API_KEY = "AIzaSyAA3WDuGwXmUyaeGgWevlYymK4lOPLyhKE"

def initialize_gemini():
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        
        # List available models to debug
        print("\nAvailable Models:")
        for model in genai.list_models():
            if 'generateContent' in model.supported_generation_methods:
                print(f"- {model.name} (Supports generateContent)")
        
        # Current working model names (try these in order)
        model_names = [
            'gemini-1.5-pro-latest',  # Most recent
            'gemini-1.0-pro-latest',   # Fallback
            'models/gemini-pro'        # Legacy
        ]
        
        for model_name in model_names:
            try:
                return genai.GenerativeModel(model_name)
            except Exception as e:
                print(f"Failed with {model_name}: {str(e)}")
                continue
                
        raise Exception("No working model found")
        
    except Exception as e:
        print(f"Gemini initialization error: {str(e)}")
        return None

def get_ai_response(prompt):
    try:
        model = initialize_gemini()
        if not model:
            return {
                'error': 'AI service unavailable - check server logs',
                'type': 'ai'
            }
        
        response = model.generate_content(
            prompt,
            safety_settings={
                "HARM_CATEGORY_HARASSMENT": "BLOCK_NONE",
                "HARM_CATEGORY_HATE_SPEECH": "BLOCK_NONE",
                "HARM_CATEGORY_SEXUALLY_EXPLICIT": "BLOCK_NONE",
                "HARM_CATEGORY_DANGEROUS_CONTENT": "BLOCK_NONE"
            },
            generation_config={
                "max_output_tokens": 2048,
                "temperature": 0.7
            }
        )
        
        if response.prompt_feedback.block_reason:
            return {
                'error': f'Content blocked: {response.prompt_feedback.block_reason}',
                'type': 'ai'
            }
            
        return response.text
        
    except Exception as e:
        error_msg = f"Gemini API Error: {str(e)}"
        print(error_msg)
        return {
            'error': error_msg,
            'type': 'ai'
        }