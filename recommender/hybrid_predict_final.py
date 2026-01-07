# hybrid_predict_final.py
from surprise import SVD
import pickle
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

# Global Variables
client = None
db = None
movies = None
ratings_col = None
user_mapping_col = None
svd_model = None
C = 7.0
m = 50.0

def remove_duplicates():
    """
    Self-healing: Removes duplicate user mappings if they exist.
    Keeps the mapping with the lowest svdId (likely the original one).
    """
    try:
        pipeline = [
            {"$group": {
                "_id": "$mongoId", 
                "docs": {"$push": {"id": "$_id", "svdId": "$svdId"}}, 
                "count": {"$sum": 1}
            }},
            {"$match": {"count": {"$gt": 1}}}
        ]
        
        duplicates = list(user_mapping_col.aggregate(pipeline))
        
        if duplicates:
            print(f"[FIX] Found {len(duplicates)} users with duplicate mappings. Cleaning...")
            for entry in duplicates:
                # Sort by svdId (Ascending) -> Keep the lowest ID
                docs = sorted(entry["docs"], key=lambda x: x["svdId"])
                
                # Keep the first one, delete the rest
                remove_ids = [d["id"] for d in docs[1:]]
                if remove_ids:
                    user_mapping_col.delete_many({"_id": {"$in": remove_ids}})
            print("[FIX] Duplicates removed.")
    except Exception as e:
        print(f"[FIX] ⚠ Error during cleanup: {e}")

def init_resources():
    global client, db, movies, ratings_col, user_mapping_col, svd_model, C, m
    
    print("[INIT] Connecting to MongoDB...")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://mongodb:27017/movie-recsys")
    client = MongoClient(MONGO_URI)
    db = client["movie-recsys"]
    movies = db["movies"]
    ratings_col = db["ratings"]
    user_mapping_col = db["user_mapping"]

    # 1. Clean Data First
    remove_duplicates()

    # 2. Create Indexes (Safe Mode)
    try:
        print("[INIT] Creating indexes...")
        movies.create_index([("tmdbId", ASCENDING)], unique=True)
        # This will now succeed because duplicates are gone
        user_mapping_col.create_index([("mongoId", ASCENDING)], unique=True)
        
        movies.create_index([("genres.name", ASCENDING), ("voteAverage", DESCENDING)])
        movies.create_index([("production_countries.iso_3166_1", ASCENDING), ("voteAverage", DESCENDING)])
        movies.create_index([("voteCount", DESCENDING)])
        print("[INIT] ✓ Indexes created successfully")
    except Exception as e:
        print(f"[INIT] ⚠ Index warning: {e}")

    # 3. Load Model
    try:
        model_path = "svd_model.pkl"
        if os.path.exists(model_path):
            print(f"[INIT] Loading SVD Model from {model_path}...")
            with open(model_path, "rb") as f:
                svd_model = pickle.load(f)
            print("[INIT] ✓ SVD model loaded")
        else:
            print("[INIT] ⚠ svd_model.pkl NOT FOUND. Running in Content-Only mode.")
            svd_model = None
    except Exception as e:
        print(f"[INIT] ⚠ Model load failed: {e}")
        svd_model = None

    # 4. Calculate Stats
    try:
        count = movies.count_documents({})
        if count == 0:
            print("[INIT] ⚠ DB is empty! Using defaults.")
        else:
            stats = list(movies.aggregate([
                {"$group": {"_id": None, "avg_vote": {"$avg": "$voteAverage"}, "avg_count": {"$avg": "$voteCount"}}}
            ]))
            if stats:
                C = stats[0]["avg_vote"] or 7.0
                m = stats[0]["avg_count"] or 50.0
            print(f"[INIT] Stats: C={C:.2f}, m={m:.2f}")
    except Exception as e:
        print(f"[INIT] ⚠ Stats calc failed: {e}")

# =============================================
# HELPERS
# =============================================
def get_or_create_svd_id(user_mongo_id):
    if isinstance(user_mongo_id, str): user_mongo_id = ObjectId(user_mongo_id)
    
    # Try find first
    mapping = user_mapping_col.find_one({"mongoId": user_mongo_id})
    if mapping: return mapping["svdId"]
    
    # Create new if not exists (Atomic-ish check handled by Unique Index now)
    try:
        max_mapping = user_mapping_col.find_one({}, sort=[("svdId", -1)])
        new_id = (max_mapping["svdId"] + 1) if max_mapping else 1000
        user_mapping_col.insert_one({"mongoId": user_mongo_id, "svdId": new_id})
        return new_id
    except:
        # Race condition fallback: someone else created it just now
        mapping = user_mapping_col.find_one({"mongoId": user_mongo_id})
        return mapping["svdId"] if mapping else 1000

def classify_user(rating_count):
    if rating_count <= 5: return "new", 0.1, 0.6, 0.3
    elif rating_count <= 20: return "growing", 0.4, 0.5, 0.1
    else: return "active", 0.75, 0.22, 0.03

def weighted_rating(v, R):
    v = v or 0; R = R or 0
    return (v / (v + m) * R) + (m / (v + m) * C)

def normalize(score, min_val, max_val):
    if max_val == min_val: return 5.0
    return max(0, min(10, (score - min_val) / (max_val - min_val) * 10))

def get_cf_score(svd_user_id, movie_id):
    if svd_model is None: return 5.0
    try:
        pred = svd_model.predict(svd_user_id, movie_id)
        return normalize(pred.est, 0.5, 5.0)
    except:
        return 5.0

def get_content_score(target_tmdbId, top_n=150):
    if movies is None: return []
    target = movies.find_one({"tmdbId": target_tmdbId})
    if not target: return []
    genreIds = [g.get('id') for g in target.get('genres', []) if g.get('id')]
    castIds = [c.get('id') for c in target.get('cast', [])[:5] if c.get('id')]
    
    pipeline = [
        {'$match': {'tmdbId': {'$ne': target_tmdbId}}},
        {'$addFields': {
            'genreMatch': {'$size': {'$setIntersection': [{'$ifNull': ['$genres.id', []]}, genreIds]}},
            'castMatch': {'$size': {'$setIntersection': [{'$ifNull': ['$cast.id', []]}, castIds]}},
        }},
        {'$addFields': {'rawScore': {'$add': [{'$multiply': ['$genreMatch', 2.0]}, {'$multiply': ['$castMatch', 1.5]}]}}},
        {'$match': {'rawScore': {'$gt': 0}}},
        {'$sort': {'rawScore': -1}},
        {'$limit': top_n}
    ]
    results = list(movies.aggregate(pipeline))
    if not results: return []
    scores = [r['rawScore'] for r in results]
    min_s, max_s = min(scores), max(scores)
    for r in results: r['contentScore'] = normalize(r['rawScore'], min_s, max_s)
    return results

def get_hybrid_recommendations(user_mongo_id, target_tmdbId=None, top_n=10):
    if client is None: raise Exception("Database not initialized")
    svd_user_id = get_or_create_svd_id(user_mongo_id)
    if isinstance(user_mongo_id, str): user_mongo_id = ObjectId(user_mongo_id)
    rating_count = ratings_col.count_documents({"userId": user_mongo_id})
    user_type, cf_w, content_w, pop_w = classify_user(rating_count)
    
    if target_tmdbId: candidates = get_content_score(target_tmdbId, 100)
    else: candidates = []
    
    rated_tmdb = [m['tmdbId'] for m in movies.find({"_id": {"$in": [r['movieId'] for r in ratings_col.find({"userId": user_mongo_id}, {"movieId": 1})]}}, {"tmdbId": 1})]
    candidates = [c for c in candidates if c['tmdbId'] not in rated_tmdb]
    
    results = []
    for c in candidates:
        mid = c['tmdbId']
        cf_score = get_cf_score(svd_user_id, mid) if cf_w > 0 else 0
        content_score = c.get('contentScore', 0)
        pop_score = weighted_rating(c.get('voteCount', 0), c.get('voteAverage', 0))
        hybrid = (cf_w * cf_score + content_w * content_score + pop_w * pop_score)
        c['hybridScore'] = hybrid
        results.append(c)
        
    results.sort(key=lambda x: x['hybridScore'], reverse=True)
    final = []
    for r in results[:top_n]:
        r['_id'] = str(r.get('_id', ''))
        final.append(r)
    return final
