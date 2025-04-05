from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def recommend_videos(videos, user_interest):
    try:
        if not videos:
            return []
            
        tfidf = TfidfVectorizer(stop_words="english")
        descriptions = [video["snippet"]["description"] for video in videos if "snippet" in video]
        
        if not descriptions:
            return videos[:3]
            
        tfidf_matrix = tfidf.fit_transform(descriptions)
        user_vector = tfidf.transform([user_interest])
        similarities = cosine_similarity(user_vector, tfidf_matrix)
        top_indices = similarities.argsort()[0][-3:][::-1]
        return [videos[i] for i in top_indices]
    except Exception as e:
        print(f"Recommendation error: {e}")
        return videos[:3]