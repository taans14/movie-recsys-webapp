# main_simple.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from contextlib import asynccontextmanager
import traceback
from bson import ObjectId
from math import ceil


# Import as 'logic' to ensure we see the updated variables
import hybrid_predict_final as logic

@asynccontextmanager
async def lifespan(app: FastAPI):
    logic.init_resources()
    yield

app = FastAPI(title="Movie RecSys", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendRequest(BaseModel):
    user_id: Optional[str] = Field(None)
    tmdbId: Optional[int] = Field(None)
    top_n: int = Field(10)

# 1. PERSONALIZED
@app.post("/recommend/hybrid")
def recommend_hybrid(request: RecommendRequest):
    try:
        if logic.movies is None: raise HTTPException(500, "DB not initialized")
        if not request.user_id:
            if not request.tmdbId: raise HTTPException(400, "tmdbId required")
            candidates = logic.get_content_score(request.tmdbId, request.top_n)
            for c in candidates: c['_id'] = str(c.get('_id', ''))
            return {"success": True, "data": candidates}
        results = logic.get_hybrid_recommendations(request.user_id, request.tmdbId, request.top_n)
        return {"success": True, "data": results}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

@app.post("/recommend/similar")
def similar_proxy(request: RecommendRequest):
    return recommend_hybrid(request)

@app.get("/recommend/for-you")
def recommend_for_you(user_id: str, limit: int = 20):
    try:
        if logic.movies is None: raise HTTPException(500, "DB not initialized")
        user_mongo_id = ObjectId(user_id)
        svd_user_id = logic.get_or_create_svd_id(user_mongo_id)
        pipeline = [
            {"$match": {"voteCount": {"$gt": 50}}},
            {"$sample": {"size": 100}},
            {"$project": {"tmdbId": 1, "title": 1, "posterPath": 1, "voteAverage": 1}}
        ]
        candidates = list(logic.movies.aggregate(pipeline))
        results = []
        for mov in candidates:
            score = logic.get_cf_score(svd_user_id, mov['tmdbId'])
            if score > 6.0:
                mov['_id'] = str(mov['_id'])
                mov['predictedRating'] = score
                results.append(mov)
        results.sort(key=lambda x: x['predictedRating'], reverse=True)
        return {"success": True, "data": results[:limit]}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

# 2. DISCOVERY
@app.get("/discover/trending")
def discover_trending(limit: int = 20):
    try:
        results = list(logic.movies.find({"voteCount": {"$gt": 50}}).sort("popularity", -1).limit(limit))
        for r in results: r['_id'] = str(r['_id'])
        return {"success": True, "data": results}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

@app.get("/discover/top-rated")
def discover_top_rated(limit: int = 20):
    try:
        results = list(logic.movies.aggregate([
            {"$match": {"voteCount": {"$gte": 100}}},
            {"$addFields": {"wr": {"$add": [{"$multiply": [{"$divide": ["$voteCount", {"$add": ["$voteCount", logic.m]}]}, "$voteAverage"]}, {"$multiply": [{"$divide": [logic.m, {"$add": ["$voteCount", logic.m]}]}, logic.C]}]}}},
            {"$sort": {"wr": -1}},
            {"$limit": limit}
        ]))
        for r in results: r['_id'] = str(r['_id'])
        return {"success": True, "data": results}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

@app.get("/discover/by-genre")
def discover_by_genre(genre: str, page: int = 1, limit: int = 20):
    try:
        skip = (page - 1) * limit
        query = {
            "genres.name": genre,
            "voteCount": {"$gt": 10} 
        }

        # 1. Get Total Count
        total_docs = logic.movies.count_documents(query)
        total_pages = ceil(total_docs / limit)

        # 2. Get Data
        cursor = logic.movies.find(query).sort("voteAverage", -1).skip(skip).limit(limit)
        results = list(cursor)
        
        for r in results: r['_id'] = str(r['_id'])
        
        # 3. Return Standard Structure
        return {
            "success": True, 
            "data": results,
            "pagination": {
                "page": page,
                "limit": limit,
                "totalDocs": total_docs,
                "totalPages": total_pages
            }
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

# 2. UPDATE: discover_by_country
@app.get("/discover/by-country")
def discover_by_country(country: str, page: int = 1, limit: int = 20):
    try:
        skip = (page - 1) * limit
        query = {
            "production_countries.iso_3166_1": country,
            "voteCount": {"$gt": 5}
        }

        # 1. Get Total Count
        total_docs = logic.movies.count_documents(query)
        total_pages = ceil(total_docs / limit)

        # 2. Get Data
        cursor = logic.movies.find(query).sort("voteAverage", -1).skip(skip).limit(limit)
        results = list(cursor)
        
        for r in results: r['_id'] = str(r['_id'])
        
        return {
            "success": True, 
            "data": results,
            "pagination": {
                "page": page,
                "limit": limit,
                "totalDocs": total_docs,
                "totalPages": total_pages
            }
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

@app.get("/discover/genres")
def get_genres():
    try:
        pipeline = [{"$unwind": "$genres"}, {"$group": {"_id": "$genres.id", "name": {"$first": "$genres.name"}}}, {"$sort": {"name": 1}}]
        genres = list(logic.movies.aggregate(pipeline))
        return {"success": True, "data": [{"id": g["_id"], "name": g["name"]} for g in genres]}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

@app.get("/discover/countries")
def get_countries():
    try:
        pipeline = [{"$unwind": "$production_countries"}, {"$group": {"_id": "$production_countries.iso_3166_1", "name": {"$first": "$production_countries.name"}}}, {"$sort": {"name": 1}}]
        countries = list(logic.movies.aggregate(pipeline))
        return {"success": True, "data": [{"iso_3166_1": c["_id"], "name": c["name"]} for c in countries if c["_id"]]}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

@app.get("/discover/by-person")
def get_movies_by_person(person_id: int, page: int = 1, limit: int = 20):
    try:
        skip = (page - 1) * limit
        
        query = {
            "$or": [
                {"cast.id": person_id},
                {"directors.id": person_id}
            ]
        }

        total_docs = logic.movies.count_documents(query)
        total_pages = ceil(total_docs / limit)

        cursor = logic.movies.find(query).sort("popularity", -1).skip(skip).limit(limit)
        results = list(cursor)

        for r in results: r['_id'] = str(r['_id'])

        return {
            "success": True,
            "data": results,
            "pagination": {
                "page": page,
                "limit": limit,
                "totalDocs": total_docs,
                "totalPages": total_pages
            }
        }

    except Exception as e:
        traceback.print_exc()
        return {
            "success": False, 
            "data": [], 
            "pagination": { "page": page, "limit": limit, "totalDocs": 0, "totalPages": 0 }
        }
