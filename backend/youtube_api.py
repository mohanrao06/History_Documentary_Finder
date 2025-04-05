import requests

YOUTUBE_API_KEY = "AIzaSyAqlhGyZUTLMn4-AuC_tyMrNl2lv6M2SNQ"

def fetch_documentaries(query, max_results=5):
    try:
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "key": YOUTUBE_API_KEY,
            "q": f"{query} documentary",
            "part": "snippet",
            "type": "video",
            "maxResults": max_results,
            "videoDuration": "long",
            "relevanceLanguage": "en",
            "videoEmbeddable": "true"
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json().get("items", [])
    except requests.exceptions.RequestException as e:
        print(f"YouTube API Error: {e}")
        return []