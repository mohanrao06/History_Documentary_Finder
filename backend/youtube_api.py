import requests
from datetime import datetime, timedelta

YOUTUBE_API_KEY = "AIzaSyAqlhGyZUTLMn4-AuC_tyMrNl2lv6M2SNQ"

def fetch_documentaries(query, max_results=10):
    try:
        # First search for videos
        search_url = "https://www.googleapis.com/youtube/v3/search"
        search_params = {
            "key": YOUTUBE_API_KEY,
            "q": f"{query} documentary or film",
            "part": "snippet",
            "type": "video",
            "maxResults": max_results,
            "videoDuration": "long",
            "relevanceLanguage": "en",
            "videoEmbeddable": "true"
        }
        search_response = requests.get(search_url, params=search_params)
        search_response.raise_for_status()
        videos = search_response.json().get("items", [])
        
        if not videos:
            return []
        
        # Get video details (including duration)
        video_ids = [video['id']['videoId'] for video in videos]
        details_url = "https://www.googleapis.com/youtube/v3/videos"
        details_params = {
            "key": YOUTUBE_API_KEY,
            "id": ",".join(video_ids),
            "part": "contentDetails,snippet,statistics"
        }
        details_response = requests.get(details_url, params=details_params)
        details_response.raise_for_status()
        details = details_response.json().get("items", [])
        
        # Combine search results with details
        enhanced_videos = []
        for video in videos:
            video_id = video['id']['videoId']
            detail = next((d for d in details if d['id'] == video_id), None)
            if detail:
                enhanced_video = {
                    **video,
                    "duration": detail['contentDetails']['duration'],
                    "publishedAt": detail['snippet']['publishedAt'],
                    "viewCount": detail['statistics'].get('viewCount', 0)
                }
                enhanced_videos.append(enhanced_video)
        
        return enhanced_videos
        
    except requests.exceptions.RequestException as e:
        print(f"YouTube API Error: {e}")
        return []