from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='../frontend')
CORS(app)

@app.route('/')
def home():
    return "Documentary Finder is running!"
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
    
    if not interest:
        return jsonify({
            'error': 'Please enter a search term'
        })
    
    try:
        # Fetch YouTube videos
        videos = fetch_documentaries(interest)
        if not videos:
            return jsonify({
                'results': [],
                'error': 'No documentaries found'
            })
        
        # Get recommended videos
        recommended_videos = recommend_videos(videos, interest)
        
        # Generate summaries and ratings for each video
        enhanced_videos = []
        for video in recommended_videos:
            prompt = (
                f"Provide a concise summary (2-3 sentences) and a rating out of 10 "
                f"for this documentary about {interest} titled '{video['snippet']['title']}'. "
                f"Description: {video['snippet']['description'][:200]}... "
                "The rating should be based on how well it covers the topic, production quality, "
                "and historical accuracy. Format as: 'Summary: [summary text] Rating: X/10'"
            )
            
            ai_response = get_ai_response(prompt)
            
            enhanced_video = {
                'video': video,
                'summary': ai_response if isinstance(ai_response, str) else "Summary not available",
                'rating': extract_rating(ai_response) if isinstance(ai_response, str) else "N/A"
            }
            enhanced_videos.append(enhanced_video)
            
        return jsonify({
            'results': enhanced_videos
        })
            
    except Exception as e:
        return jsonify({
            'error': str(e)
        })

def extract_rating(text):
    # Helper function to extract rating from AI response
    import re
    match = re.search(r'Rating:\s*(\d+/10)', text)
    return match.group(1) if match else "N/A"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)