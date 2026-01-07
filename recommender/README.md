\# Movie Recommendation System API Documentation

\## Overview

This is a comprehensive movie recommendation system that combines \*\*Collaborative Filtering (CF)\*\*, \*\*Content-Based Filtering\*\*, and \*\*Popularity-Based\*\* approaches to provide personalized movie recommendations.

\# Movie Recommendation System API Documentation

\## Overview

This is a comprehensive movie recommendation system that combines \*\*Collaborative Filtering (CF)\*\*, \*\*Content-Based Filtering\*\*, and \*\*Popularity-Based\*\* approaches to provide personalized movie recommendations.

---

\## 🚀 Getting Started

\### Prerequisites

\- Python 3.8+

\- MongoDB (running locally or remotely)

\- Required Python packages (see `requirements.txt`)

\### Installation

1\. \*\*Clone or extract the project files\*\*

2\. \*\*Install dependencies\*\*

```bash

pip install -r requirements.txt

```

3\. \*\*Configure MongoDB connection\*\*

&nbsp; - Ensure your `.env` file contains the correct MongoDB URI:

&nbsp; ```

&nbsp; MONGO_URI=mongodb://username:password@localhost:27017/movie-recsys?authSource=admin

&nbsp; ```

4\. \*\*Prepare the SVD Model\*\*

&nbsp; - Ensure `svd\_model.pkl` exists in the project root

&nbsp; - If not, train the model first using your training script

5\. \*\*Run User Mapping Migration (First Time Only)\*\*

&nbsp; ```bash

&nbsp; python migrate_user_mapping.py

&nbsp; ```

&nbsp; This creates SVD integer IDs for existing users in your database.

6\. \*\*Start the API server\*\*

&nbsp; ```bash

&nbsp; uvicorn main_simple:app --reload --host 0.0.0.0 --port 8000

&nbsp; ```

7\. \*\*Access the API\*\*

&nbsp; - API Base URL: `http://localhost:8000` `http://127.0.0.1:8000`

&nbsp; - Interactive Documentation: `http://localhost:8000/docs`

---

\## 📚 API Endpoints

\### 1. \*\*Hybrid Recommendations\*\* (Personalized)

\*\*Best for:\*\* Movie detail pages - "Similar Movies You Might Like"

\*\*Endpoint:\*\* `POST /recommend/hybrid`

\*\*Description:\*\* Combines CF, Content-Based, and Popularity scores with dynamic weights based on user's rating history.

\*\*Request Body:\*\*

```json

{

&nbsp; "user\_id": "694ba285db47083147ac3590",

&nbsp; "tmdbId": 862,

&nbsp; "top\_n": 10

}

```

\*\*Parameters:\*\*

\- `user\_id` (required): MongoDB ObjectId of the user (24 characters)

\- `tmdbId` (optional): Target movie ID for content-based similarity

\- `top\_n` (optional): Number of recommendations (default: 10, max: 50)

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/recommend/hybrid' \\

--header 'Content-Type: application/json' \\

--data '{

&nbsp; "user\_id": "694ba285db47083147ac3590",

&nbsp; "tmdbId": 862,

&nbsp; "top\_n": 10

}'

```

\*\*Response:\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "tmdbId": 863,

&nbsp;     "title": "Toy Story 2",

&nbsp;     "hybridScore": 8.54,

&nbsp;     "cfScore": 6.76,

&nbsp;     "contentScore": 10,

&nbsp;     "popularityScore": 7.59,

&nbsp;     "userType": "new",

&nbsp;     "ratingCount": 12,

&nbsp;     "genreMatch": 3,

&nbsp;     "castMatch": 5,

&nbsp;     "directorMatch": 1,

&nbsp;     "overview": "...",

&nbsp;     "posterPath": "/...",

&nbsp;     ...

&nbsp;   }

&nbsp; ],

&nbsp; "count": 10

}

```

---

\### 2. \*\*For You - Pure CF\*\* (Homepage)

\*\*Best for:\*\* Homepage personalized section - "Recommended For You"

\*\*Endpoint:\*\* `GET /recommend/for-you`

\*\*Description:\*\* Pure collaborative filtering recommendations based on user's taste profile. Requires \*\*minimum 10 ratings\*\*.

\*\*Query Parameters:\*\*

\- `user\_id` (required): MongoDB ObjectId of the user

\- `limit` (optional): Number of recommendations (default: 20, max: 50)

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/recommend/for-you?user\_id=694ba285db47083147ac3590\&limit=20'

```

\*\*Response:\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "tmdbId": 318,

&nbsp;     "title": "The Shawshank Redemption",

&nbsp;     "predictedRating": 8.53,

&nbsp;     "ratingCount": 12,

&nbsp;     "userType": "new",

&nbsp;     ...

&nbsp;   }

&nbsp; ],

&nbsp; "count": 20,

&nbsp; "method": "collaborative\_filtering"

}

```

\*\*Note:\*\* If user has less than 10 ratings:

```json

{

&nbsp; "success": false,

&nbsp; "message": "Need at least 10 ratings for personalized recommendations",

&nbsp; "rating\_count": 5,

&nbsp; "required": 10

}

```

---

\### 3. \*\*Discover by Genre\*\*

\*\*Best for:\*\* Browse by genre section

\*\*Endpoint:\*\* `GET /discover/by-genre`

\*\*Query Parameters:\*\*

\- `genre` (required): Genre name or ID (e.g., "Action", "28")

\- `limit` (optional): Number of results (default: 20, max: 50)

\*\*Common Genres:\*\*

\- Action (28)

\- Comedy (35)

\- Drama (18)

\- Horror (27)

\- Romance (10749)

\- Sci-Fi (878)

\- Thriller (53)

\- Animation (16)

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/by-genre?genre=Action\&limit=20'

```

\*\*Response:\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "tmdbId": 155,

&nbsp;     "title": "The Dark Knight",

&nbsp;     "weightedScore": 38.71,

&nbsp;     "voteAverage": 8.525,

&nbsp;     "voteCount": 34780,

&nbsp;     ...

&nbsp;   }

&nbsp; ],

&nbsp; "count": 20,

&nbsp; "genre": "Action",

&nbsp; "filter": "genre"

}

```

---

\### 4. \*\*Discover by Country\*\*

\*\*Best for:\*\* Explore movies by production country

\*\*Endpoint:\*\* `GET /discover/by-country`

\*\*Query Parameters:\*\*

\- `country` (required): ISO 3166-1 country code (e.g., "US", "KR", "JP")

\- `limit` (optional): Number of results (default: 20, max: 50)

\*\*Common Countries:\*\*

\- US: United States

\- KR: South Korea

\- JP: Japan

\- FR: France

\- GB: United Kingdom

\- IN: India

\- CN: China

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/by-country?country=KR\&limit=20'

```

---

\### 5. \*\*Trending Movies\*\*

\*\*Best for:\*\* Homepage trending section

\*\*Endpoint:\*\* `GET /discover/trending`

\*\*Query Parameters:\*\*

\- `time\_window` (optional): "day", "week", or "month" (default: "week")

\- `limit` (optional): Number of results (default: 20, max: 50)

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/trending?time\_window=week\&limit=20'

```

---

\### 6. \*\*Top Rated All Time\*\*

\*\*Best for:\*\* Browse classic/top movies

\*\*Endpoint:\*\* `GET /discover/top-rated`

\*\*Query Parameters:\*\*

\- `limit` (optional): Number of results (default: 20, max: 100)

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/top-rated?limit=50'

```

---

\### 7. \*\*Available Genres List\*\*

\*\*Best for:\*\* Genre filter UI

\*\*Endpoint:\*\* `GET /discover/genres`

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/genres'

```

\*\*Response:\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "id": 28,

&nbsp;     "name": "Action",

&nbsp;     "movie\_count": 1523

&nbsp;   },

&nbsp;   ...

&nbsp; ],

&nbsp; "count": 19

}

```

---

\### 8. \*\*Available Countries List\*\*

\*\*Best for:\*\* Country filter UI

\*\*Endpoint:\*\* `GET /discover/countries`

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/countries'

```

---

\### 9. \*\*Health Check\*\*

\*\*Endpoint:\*\* `GET /health`

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/health'

```

\*\*Response:\*\*

```json

{

&nbsp; "status": "ok",

&nbsp; "model\_loaded": true

}

```

---

\## 🎯 How the System Works

\### User Classification

The system automatically classifies users based on rating count:

| User Type | Rating Count | CF Weight | Content Weight | Popularity Weight |

|-----------|-------------|-----------|----------------|-------------------|

| Cold Start | 0 | 0% | 60% | 40% |

| Very New | 1-5 | 10% | 60% | 30% |

| New | 6-15 | 30% | 50% | 20% |

| Growing | 16-30 | 50% | 40% | 10% |

| Average | 31-70 | 65% | 30% | 5% |

| Active | 70+ | 75% | 22% | 3% |

\### Scoring Components

1\. \*\*Collaborative Filtering (CF Score)\*\*

&nbsp; - Uses SVD matrix factorization

&nbsp; - Predicts user's rating for unseen movies

&nbsp; - Range: 0-10

2\. \*\*Content-Based Score\*\*

&nbsp; - Genre similarity: 2.0x weight

&nbsp; - Director match: 3.0x weight

&nbsp; - Cast similarity: 1.5x weight

&nbsp; - Keywords: 1.0x weight

&nbsp; - Range: 0-10

3\. \*\*Popularity Score\*\*

&nbsp; - IMDB Weighted Rating formula

&nbsp; - Balances vote count and average rating

&nbsp; - Range: 0-10

\*\*Final Hybrid Score:\*\*

```

Hybrid = (CF\_weight × CF\_score) + (Content\_weight × Content\_score) + (Pop\_weight × Pop\_score)

```

---

\## 🔧 Testing with Postman

\### Import Collection Steps:

1\. Open Postman

2\. Click \*\*Import\*\* → \*\*Raw Text\*\*

3\. Paste the following requests:

\*\*Collection: Movie Recommendations API\*\*

```json

{

&nbsp; "info": {

&nbsp;   "name": "Movie Recommendation API",

&nbsp;   "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"

&nbsp; },

&nbsp; "item": \[

&nbsp;   {

&nbsp;     "name": "Hybrid Recommendations",

&nbsp;     "request": {

&nbsp;       "method": "POST",

&nbsp;       "header": \[{"key": "Content-Type", "value": "application/json"}],

&nbsp;       "body": {

&nbsp;         "mode": "raw",

&nbsp;         "raw": "{\\n  \\"user\_id\\": \\"694ba285db47083147ac3590\\",\\n  \\"tmdbId\\": 862,\\n  \\"top\_n\\": 10\\n}"

&nbsp;       },

&nbsp;       "url": "http://127.0.0.1:8000/recommend/hybrid"

&nbsp;     }

&nbsp;   },

&nbsp;   {

&nbsp;     "name": "For You (CF)",

&nbsp;     "request": {

&nbsp;       "method": "GET",

&nbsp;       "url": "http://127.0.0.1:8000/recommend/for-you?user\_id=694ba285db47083147ac3590\&limit=20"

&nbsp;     }

&nbsp;   },

&nbsp;   {

&nbsp;     "name": "Discover by Genre",

&nbsp;     "request": {

&nbsp;       "method": "GET",

&nbsp;       "url": "http://127.0.0.1:8000/discover/by-genre?genre=Action\&limit=20"

&nbsp;     }

&nbsp;   }

&nbsp; ]

}

```

---

\## 📊 Database Collections

\### Required Collections:

1\. \*\*movies\*\* - Movie metadata (title, genres, cast, directors, keywords, etc.)

2\. \*\*ratings\*\* - User ratings (userId, movieId, rating, timestamp)

3\. \*\*user_mapping\*\* - Maps MongoDB ObjectIds to SVD integer IDs

\### User Mapping Structure:

```javascript

{

&nbsp; "\_id": ObjectId("..."),

&nbsp; "mongoId": ObjectId("694ba285db47083147ac3590"),

&nbsp; "svdId": 1234,

&nbsp; "createdAt": ISODate("..."),

&nbsp; "migrated": false

}

```

---

\## ⚠️ Important Notes

1\. \*\*User ID Format:\*\* Must be a valid 24-character MongoDB ObjectId

2\. \*\*Cold Start Users:\*\* Need at least 10 ratings for CF recommendations

3\. \*\*New Users:\*\* Automatically get assigned SVD IDs starting from 1000+

4\. \*\*Model File:\*\* Ensure `svd\_model.pkl` exists before starting the server

5\. \*\*Migration:\*\* Run `migrate\_user\_mapping.py` only once for existing users

---

\## 🐛 Troubleshooting

\### API returns 500 error:

\- Check MongoDB connection in `.env`

\- Verify `svd\_model.pkl` exists

\- Check server logs for detailed error messages

\### "Invalid ObjectId" error:

\- Ensure `user\_id` is exactly 24 characters

\- Use valid hexadecimal characters only

\### CF recommendations not working:

\- User needs minimum 10 ratings

\- Run user mapping migration if not done

\- Check if SVD model is loaded (`/health` endpoint)

---

\## 📞 Support

For questions or issues, please refer to:

\- API Documentation: `http://localhost:8000/docs`

\- Health Check: `http://localhost:8000/health`

\- Code comments in `hybrid\_predict\_final.py` and `main\_simple.py`

---

\*\*Version:\*\* 2.0

\*\*Last Updated:\*\* January 2026

---

\## 🚀 Getting Started

\### Prerequisites

\- Python 3.8+

\- MongoDB (running locally or remotely)

\- Required Python packages (see `requirements.txt`)

\### Installation

1\. \*\*Clone or extract the project files\*\*

2\. \*\*Install dependencies\*\*

```bash

pip install -r requirements.txt

```

3\. \*\*Configure MongoDB connection\*\*

&nbsp; - Ensure your `.env` file contains the correct MongoDB URI:

&nbsp; ```

&nbsp; MONGO_URI=mongodb://username:password@localhost:27017/movie-recsys?authSource=admin

&nbsp; ```

4\. \*\*Prepare the SVD Model\*\*

&nbsp; - Ensure `svd\_model.pkl` exists in the project root

&nbsp; - If not, train the model first using your training script

5\. \*\*Run User Mapping Migration (First Time Only)\*\*

&nbsp; ```bash

&nbsp; python migrate_user_mapping.py

&nbsp; ```

&nbsp; This creates SVD integer IDs for existing users in your database.

6\. \*\*Start the API server\*\*

&nbsp; ```bash

&nbsp; uvicorn main_simple:app --reload --host 0.0.0.0 --port 8000

&nbsp; ```

7\. \*\*Access the API\*\*

&nbsp; - API Base URL: `http://localhost:8000`

&nbsp; - Interactive Documentation: `http://localhost:8000/docs`

---

\## 📚 API Endpoints

\### 1. \*\*Hybrid Recommendations\*\* (Personalized)

\*\*Best for:\*\* Movie detail pages - "Similar Movies You Might Like"

\*\*Endpoint:\*\* `POST /recommend/hybrid`

\*\*Description:\*\* Combines CF, Content-Based, and Popularity scores with dynamic weights based on user's rating history.

\*\*Request Body:\*\*

```json

{

&nbsp; "user\_id": "694ba285db47083147ac3590",

&nbsp; "tmdbId": 862,

&nbsp; "top\_n": 10

}

```

\*\*Parameters:\*\*

\- `user\_id` (required): MongoDB ObjectId of the user (24 characters)

\- `tmdbId` (optional): Target movie ID for content-based similarity

\- `top\_n` (optional): Number of recommendations (default: 10, max: 50)

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/recommend/hybrid' \\

--header 'Content-Type: application/json' \\

--data '{

&nbsp; "user\_id": "694ba285db47083147ac3590",

&nbsp; "tmdbId": 862,

&nbsp; "top\_n": 10

}'

```

\*\*Response:\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "tmdbId": 863,

&nbsp;     "title": "Toy Story 2",

&nbsp;     "hybridScore": 8.54,

&nbsp;     "cfScore": 6.76,

&nbsp;     "contentScore": 10,

&nbsp;     "popularityScore": 7.59,

&nbsp;     "userType": "new",

&nbsp;     "ratingCount": 12,

&nbsp;     "genreMatch": 3,

&nbsp;     "castMatch": 5,

&nbsp;     "directorMatch": 1,

&nbsp;     "overview": "...",

&nbsp;     "posterPath": "/...",

&nbsp;     ...

&nbsp;   }

&nbsp; ],

&nbsp; "count": 10

}

```

---

\### 2. \*\*For You - Pure CF\*\* (Homepage)

\*\*Best for:\*\* Homepage personalized section - "Recommended For You"

\*\*Endpoint:\*\* `GET /recommend/for-you`

\*\*Description:\*\* Pure collaborative filtering recommendations based on user's taste profile. Requires \*\*minimum 10 ratings\*\*.

\*\*Query Parameters:\*\*

\- `user\_id` (required): MongoDB ObjectId of the user

\- `limit` (optional): Number of recommendations (default: 20, max: 50)

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/recommend/for-you?user\_id=694ba285db47083147ac3590\&limit=20'

```

\*\*Response:\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "tmdbId": 318,

&nbsp;     "title": "The Shawshank Redemption",

&nbsp;     "predictedRating": 8.53,

&nbsp;     "ratingCount": 12,

&nbsp;     "userType": "new",

&nbsp;     ...

&nbsp;   }

&nbsp; ],

&nbsp; "count": 20,

&nbsp; "method": "collaborative\_filtering"

}

```

\*\*Note:\*\* If user has less than 10 ratings:

```json

{

&nbsp; "success": false,

&nbsp; "message": "Need at least 10 ratings for personalized recommendations",

&nbsp; "rating\_count": 5,

&nbsp; "required": 10

}

```

---

\### 3. \*\*Discover by Genre\*\*

\*\*Best for:\*\* Browse by genre section

\*\*Endpoint:\*\* `GET /discover/by-genre`

\*\*Query Parameters:\*\*

\- `genre` (required): Genre name or ID (e.g., "Action", "28")

\- `limit` (optional): Number of results (default: 20, max: 50)

\*\*Common Genres:\*\*

\- Action (28)

\- Comedy (35)

\- Drama (18)

\- Horror (27)

\- Romance (10749)

\- Sci-Fi (878)

\- Thriller (53)

\- Animation (16)

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/by-genre?genre=Action\&limit=20'

```

\*\*Response:\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "tmdbId": 155,

&nbsp;     "title": "The Dark Knight",

&nbsp;     "weightedScore": 38.71,

&nbsp;     "voteAverage": 8.525,

&nbsp;     "voteCount": 34780,

&nbsp;     ...

&nbsp;   }

&nbsp; ],

&nbsp; "count": 20,

&nbsp; "genre": "Action",

&nbsp; "filter": "genre"

}

```

---

\### 4. \*\*Discover by Country\*\*

\*\*Best for:\*\* Explore movies by production country

\*\*Endpoint:\*\* `GET /discover/by-country`

\*\*Query Parameters:\*\*

\- `country` (required): ISO 3166-1 country code (e.g., "US", "KR", "JP")

\- `limit` (optional): Number of results (default: 20, max: 50)

\*\*Common Countries:\*\*

\- US: United States

\- KR: South Korea

\- JP: Japan

\- FR: France

\- GB: United Kingdom

\- IN: India

\- CN: China

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/by-country?country=KR\&limit=20'

```

---

\### 5. \*\*Trending Movies\*\*

\*\*Best for:\*\* Homepage trending section

\*\*Endpoint:\*\* `GET /discover/trending`

\*\*Query Parameters:\*\*

\- `time\_window` (optional): "day", "week", or "month" (default: "week")

\- `limit` (optional): Number of results (default: 20, max: 50)

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/trending?time\_window=week\&limit=20'

```

---

\### 6. \*\*Top Rated All Time\*\*

\*\*Best for:\*\* Browse classic/top movies

\*\*Endpoint:\*\* `GET /discover/top-rated`

\*\*Query Parameters:\*\*

\- `limit` (optional): Number of results (default: 20, max: 100)

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/top-rated?limit=50'

```

---

\### 7. \*\*Available Genres List\*\*

\*\*Best for:\*\* Genre filter UI

\*\*Endpoint:\*\* `GET /discover/genres`

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/genres'

```

\*\*Response:\*\*

```json

{

&nbsp; "success": true,

&nbsp; "data": \[

&nbsp;   {

&nbsp;     "id": 28,

&nbsp;     "name": "Action",

&nbsp;     "movie\_count": 1523

&nbsp;   },

&nbsp;   ...

&nbsp; ],

&nbsp; "count": 19

}

```

---

\### 8. \*\*Available Countries List\*\*

\*\*Best for:\*\* Country filter UI

\*\*Endpoint:\*\* `GET /discover/countries`

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/discover/countries'

```

---

\### 9. \*\*Health Check\*\*

\*\*Endpoint:\*\* `GET /health`

\*\*cURL Example:\*\*

```bash

curl --location 'http://127.0.0.1:8000/health'

```

\*\*Response:\*\*

```json

{

&nbsp; "status": "ok",

&nbsp; "model\_loaded": true

}

```

---

\## 🎯 How the System Works

\### User Classification

The system automatically classifies users based on rating count:

| User Type | Rating Count | CF Weight | Content Weight | Popularity Weight |

|-----------|-------------|-----------|----------------|-------------------|

| Cold Start | 0 | 0% | 60% | 40% |

| Very New | 1-5 | 10% | 60% | 30% |

| New | 6-15 | 30% | 50% | 20% |

| Growing | 16-30 | 50% | 40% | 10% |

| Average | 31-70 | 65% | 30% | 5% |

| Active | 70+ | 75% | 22% | 3% |

\### Scoring Components

1\. \*\*Collaborative Filtering (CF Score)\*\*

&nbsp; - Uses SVD matrix factorization

&nbsp; - Predicts user's rating for unseen movies

&nbsp; - Range: 0-10

2\. \*\*Content-Based Score\*\*

&nbsp; - Genre similarity: 2.0x weight

&nbsp; - Director match: 3.0x weight

&nbsp; - Cast similarity: 1.5x weight

&nbsp; - Keywords: 1.0x weight

&nbsp; - Range: 0-10

3\. \*\*Popularity Score\*\*

&nbsp; - IMDB Weighted Rating formula

&nbsp; - Balances vote count and average rating

&nbsp; - Range: 0-10

\*\*Final Hybrid Score:\*\*

```

Hybrid = (CF\_weight × CF\_score) + (Content\_weight × Content\_score) + (Pop\_weight × Pop\_score)

```

---

\## 🔧 Testing with Postman

\### Import Collection Steps:

1\. Open Postman

2\. Click \*\*Import\*\* → \*\*Raw Text\*\*

3\. Paste the following requests:

\*\*Collection: Movie Recommendations API\*\*

```json

{

&nbsp; "info": {

&nbsp;   "name": "Movie Recommendation API",

&nbsp;   "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"

&nbsp; },

&nbsp; "item": \[

&nbsp;   {

&nbsp;     "name": "Hybrid Recommendations",

&nbsp;     "request": {

&nbsp;       "method": "POST",

&nbsp;       "header": \[{"key": "Content-Type", "value": "application/json"}],

&nbsp;       "body": {

&nbsp;         "mode": "raw",

&nbsp;         "raw": "{\\n  \\"user\_id\\": \\"694ba285db47083147ac3590\\",\\n  \\"tmdbId\\": 862,\\n  \\"top\_n\\": 10\\n}"

&nbsp;       },

&nbsp;       "url": "http://127.0.0.1:8000/recommend/hybrid"

&nbsp;     }

&nbsp;   },

&nbsp;   {

&nbsp;     "name": "For You (CF)",

&nbsp;     "request": {

&nbsp;       "method": "GET",

&nbsp;       "url": "http://127.0.0.1:8000/recommend/for-you?user\_id=694ba285db47083147ac3590\&limit=20"

&nbsp;     }

&nbsp;   },

&nbsp;   {

&nbsp;     "name": "Discover by Genre",

&nbsp;     "request": {

&nbsp;       "method": "GET",

&nbsp;       "url": "http://127.0.0.1:8000/discover/by-genre?genre=Action\&limit=20"

&nbsp;     }

&nbsp;   }

&nbsp; ]

}

```

---

\## 📊 Database Collections

\### Required Collections:

1\. \*\*movies\*\* - Movie metadata (title, genres, cast, directors, keywords, etc.)

2\. \*\*ratings\*\* - User ratings (userId, movieId, rating, timestamp)

3\. \*\*user_mapping\*\* - Maps MongoDB ObjectIds to SVD integer IDs

\### User Mapping Structure:

```javascript

{

&nbsp; "\_id": ObjectId("..."),

&nbsp; "mongoId": ObjectId("694ba285db47083147ac3590"),

&nbsp; "svdId": 1234,

&nbsp; "createdAt": ISODate("..."),

&nbsp; "migrated": false

}

```

---

\## ⚠️ Important Notes

1\. \*\*User ID Format:\*\* Must be a valid 24-character MongoDB ObjectId

2\. \*\*Cold Start Users:\*\* Need at least 10 ratings for CF recommendations

3\. \*\*New Users:\*\* Automatically get assigned SVD IDs starting from 1000+

4\. \*\*Model File:\*\* Ensure `svd\_model.pkl` exists before starting the server

5\. \*\*Migration:\*\* Run `migrate\_user\_mapping.py` only once for existing users

---

\## 🐛 Troubleshooting

\### API returns 500 error:

\- Check MongoDB connection in `.env`

\- Verify `svd\_model.pkl` exists

\- Check server logs for detailed error messages

\### "Invalid ObjectId" error:

\- Ensure `user\_id` is exactly 24 characters

\- Use valid hexadecimal characters only

\### CF recommendations not working:

\- User needs minimum 10 ratings

\- Run user mapping migration if not done

\- Check if SVD model is loaded (`/health` endpoint)

---

\## 📞 Support

For questions or issues, please refer to:

\- API Documentation: `http://localhost:8000/docs`

\- Health Check: `http://localhost:8000/health`

\- Code comments in `hybrid\_predict\_final.py` and `main\_simple.py`

---

\*\*Version:\*\* 2.0

\*\*Last Updated:\*\* January 2026
