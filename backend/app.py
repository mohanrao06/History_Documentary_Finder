from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='../frontend')
CORS(app)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:filename>')
def serve_frontend_files(filename):
    return send_from_directory(app.static_folder, filename)

@app.route('/recommend', methods=['POST'])
def recommend():
    from youtube_api import fetch_documentaries
    from recommender import recommend_videos
    from gemini_api import get_ai_response
    
    data = request.get_json()
    interest = data.get('interest', '').strip()
    mode = data.get('mode', 'youtube')
    
    if not interest:
        return jsonify({
            'error': 'Please enter a search term',
            'type': mode
        })
    
    try:
        if mode == 'youtube':
            videos = fetch_documentaries(interest)
            if not videos:
                return jsonify({
                    'type': 'youtube',
                    'results': [],
                    'error': 'No documentaries found'
                })
            recommendations = recommend_videos(videos, interest)
            return jsonify({
                'results': recommendations,
                'type': 'youtube'
            })
        else:
            prompt = (
                f"Provide a detailed, factual historical overview about {interest}. "
                "Include: \n"
                "1. Key events and timeline\n"
                "2. Important figures\n"
                "3. Historical significance\n"
                "4. Lasting impacts\n\n"
                "Format with clear paragraphs and section headings."
            )
            ai_response = get_ai_response(prompt)
            
            if isinstance(ai_response, dict) and 'error' in ai_response:
                return jsonify(ai_response)
                
            return jsonify({
                'results': ai_response,
                'type': 'ai'
            })
            
    except Exception as e:
        return jsonify({
            'error': str(e),
            'type': mode
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)