# Movie Recommendation System

A movie discovery and recommendation platform built as a small microservices stack. This repository contains:

- A Node.js/Express backend API (primary focus of this README)
- A Python FastAPI recommender service (consumed by the backend)
- A React client (consumes the backend API)
- MongoDB (primary data store) and Redis (caching + rate limiting)

The backend exposes a versioned REST API to:

- Manage user accounts and profiles
- Serve a movie catalog stored in MongoDB
- Record user ratings and watchlists
- Proxy and cache recommendation/discovery results from the recommender service

---

## Tech Stack (Backend)

- **Language/Runtime**: Node.js (ES Modules)
- **Web framework**: Express 5
- **Database**: MongoDB via Mongoose
- **Cache / Rate limiting store**: Redis via ioredis + rate-limit-redis
- **Auth**: JWT (jsonwebtoken) stored in an HttpOnly cookie
- **Security / HTTP**: helmet, cors, cookie-parser, morgan
- **Validation**: Joi (DTOs)
- **Testing**: Jest, Supertest, mongodb-memory-server

---

## Backend Architecture

### High-level structure

- **Entry point**: [server/src/server.js](server/src/server.js)
  - Loads environment variables
  - Connects to MongoDB
  - Creates the Express app and starts the HTTP server (skips listening when `NODE_ENV=test`)

- **App composition**: [server/src/app.js](server/src/app.js)
  - Core middleware (helmet/cors/logging/body parsing)
  - Cookie parsing
  - Passport initialization (strategy is configured but not used by route protection)
  - Global API rate limit applied to `/api/v1`
  - Routes mounted at `/api/v1`
  - A final error handler returning `500` with `{ "message": "Something went wrong!" }`

- **Feature modules**: `server/src/modules/<feature>/`
  - `*.routes.js` — Express routers
  - `*.controller.js` — request handling + validation
  - `*.service.js` — business logic / DB operations / external HTTP calls
  - `*.schema.js` — Mongoose models
  - `dto/*.dto.js` — Joi validation schemas (where present)

### Folder structure (backend)

- `server/src/config/` — MongoDB/Redis/Passport configuration
- `server/src/middlewares/` — core middleware bundle, auth, rate limiting
- `server/src/modules/` — feature modules (auth, users, movies, ratings, watchlists, recommendation)
- `server/src/routes/` — API version router(s)
- `server/tests/` — Jest unit and integration tests

---

## Setup

### Prerequisites

Recommended:

- Docker + Docker Compose

If running locally without Docker:

- Node.js 22+ (matches the Docker images used here)
- MongoDB
- Redis
- Recommender service running (required for `/api/v1/recommendation/*` endpoints)

### Run with Docker Compose (recommended)

From the repository root (where [docker-compose.yml](docker-compose.yml) lives):

```bash
docker compose up -d --build
```

Exposed ports (from compose):

- Backend API: `http://localhost:5000`
- Recommender service: `http://localhost:8000`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`

### Run the backend locally (without Docker)

```bash
cd server
npm install
npm run dev
```

Note: you must have MongoDB, Redis, and the recommender service running, and your environment variables set.

---

## Environment Variables (Backend)

Backend environment variables are defined in:

- [server/.env](server/.env) (local)
- [server/.env.docker](server/.env.docker) (Docker)

Variables used by the backend code:

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port (default 5000) |
| `NODE_ENV` | Environment mode (`dev`, `prod`, `test`) |
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `CLIENT_URL` | Allowed CORS origin (CORS uses `credentials: true`) |
| `JWT_SECRET` | JWT signing/verifying secret |
| `RECOMMENDER_SERVICE_URL` | Base URL of the recommender service |

Also present in env files:

- `TMDB_API_KEY` (present, but not referenced by backend source code)

---

## API Documentation (Backend)

Base URL:

- `/api/v1`

Routing is defined in [server/src/routes/v1.js](server/src/routes/v1.js) and module routers under `server/src/modules/*/*.routes.js`.

### Authentication (how to call protected endpoints)

- On successful login/register, the backend sets an HttpOnly cookie named `accessToken`.
- Protected endpoints require this cookie.
- CORS is configured with `credentials: true`, so clients must send credentials (e.g., `fetch` with `credentials: "include"`).

### Rate limiting

Defined in [server/src/middlewares/rateLimit.middleware.js](server/src/middlewares/rateLimit.middleware.js) and backed by Redis:

- All `/api/v1/*` requests: 15-minute window, max 10000
- `/api/v1/auth/*` requests: 1-hour window, max 10

---

## Endpoints

All paths below are relative to `/api/v1`.

### Auth (`/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register a new user and set `accessToken` cookie |
| POST | `/auth/login` | No | Login and set `accessToken` cookie |
| POST | `/auth/logout` | No | Logout: clear cookie and blacklist token |

#### POST `/auth/register`

- Request body (validated by Joi in [server/src/modules/auth/dto/register.dto.js](server/src/modules/auth/dto/register.dto.js)):

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "favoriteGenres": [28, 18]
}
```

- Response `201` (cookie set; token is not returned in JSON):

```json
{
  "_id": "...",
  "id": 123,
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "role": "user",
  "avatar": ""
}
```

#### POST `/auth/login`

- Request body (validated by Joi in [server/src/modules/auth/dto/login.dto.js](server/src/modules/auth/dto/login.dto.js)):

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

- Response `200`:

```json
{
  "_id": "...",
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "role": "user",
  "avatar": ""
}
```

#### POST `/auth/logout`

- Auth: cookie is optional; if present, the token is inserted into the blacklist collection.
- Response `200`:

```json
{ "message": "User logged out successfully" }
```

---

### Users (`/users`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/profile` | Yes | Get current user profile (password excluded) |
| PUT | `/users/profile` | Yes | Update current user profile |
| GET | `/users/me` | Yes | Get a normalized “me” payload |

#### GET `/users/profile`

- Response `200`: user document (password excluded).

#### PUT `/users/profile`

- Request body: free-form updates (no DTO). The service enforces:
  - `favoriteGenres` length must be ≤ 3, otherwise `400`.
- Response `200`: updated user document (password excluded).

#### GET `/users/me`

- Response `200`:

```json
{
  "_id": "...",
  "id": 123,
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "role": "user",
  "avatar": "",
  "favoriteGenres": [28, 18]
}
```

---

### Movies (`/movies`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/movies/search` | No | Search movies (query param `q` required) |
| GET | `/movies/trending` | No | Top by `popularity` (limit 10 in service) |
| GET | `/movies/top-rated` | No | Top by `voteAverage` (limit 10 in service) |
| POST | `/movies` | No | Create a movie (Joi validated) |
| GET | `/movies` | No | List movies (pagination via `page` + `limit`) |
| GET | `/movies/:tmdb_id` | No | Get one movie by `tmdbId` |
| PUT | `/movies/:tmdb_id` | No | Update a movie by `tmdbId` (Joi validated) |
| DELETE | `/movies/:tmdb_id` | No | Delete a movie by `tmdbId` |

#### GET `/movies/search?q=...`

- Query params:
  - `q` (required)
- Response `200`: array of movies (selected fields).

#### GET `/movies?page=1&limit=20`

- Query params:
  - `page` (optional, default 1)
  - `limit` (optional, default 20)
- Response `200`: array of movie documents.

#### POST `/movies`

- Request body: validated by Joi in [server/src/modules/movies/dto/createMovie.dto.js](server/src/modules/movies/dto/createMovie.dto.js).
  - Includes `tmdbId` (required) plus other movie fields (cast, directors, genres, etc.).
- Response `201`: created movie document.

#### GET `/movies/:tmdb_id`

- Response `200`: movie document, or `404` if not found.

#### PUT `/movies/:tmdb_id`

- Request body: validated by Joi in [server/src/modules/movies/dto/updateMovie.dto.js](server/src/modules/movies/dto/updateMovie.dto.js) (at least one field required).
- Response `200`: updated movie document, or `404` if not found.

#### DELETE `/movies/:tmdb_id`

- Response `200`:

```json
{ "message": "Movie deleted successfully" }
```

---

### Ratings (`/ratings`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ratings` | Yes | Upsert a user’s rating for a movie |
| GET | `/ratings/me` | Yes | Get current user ratings (movie is populated) |

#### POST `/ratings`

- Request body (validated by Joi in [server/src/modules/ratings/dto/createRating.dto.js](server/src/modules/ratings/dto/createRating.dto.js)):

```json
{
  "movieId": "<mongo_object_id>",
  "userId": "<mongo_object_id>",
  "rating": 8
}
```

Notes from implementation:

- The authenticated user id is taken from `req.user._id`.
- The DTO still requires `userId`.
- The rating is stored internally on a 0.5–5 scale (input 1–10 is divided by 2).

- Response `200`: rating document.

#### GET `/ratings/me`

- Response `200`: array of rating records. The service:
  - populates `movieId` with the movie document,
  - normalizes `rating` back to 1–10,
  - adds `movie` as an alias of the populated movie.

---

### Watchlists (`/watchlists`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/watchlists` | Yes | Add a movie to watchlist |
| DELETE | `/watchlists/:movieId` | Yes | Remove a movie from watchlist |
| GET | `/watchlists` | Yes | List watchlist items (movie populated) |

#### POST `/watchlists`

- Request body (validated by Joi in [server/src/modules/watchlists/dto/createWatchlist.dto.js](server/src/modules/watchlists/dto/createWatchlist.dto.js)):

```json
{ "movieId": "<mongo_object_id>" }
```

- Response `201`: watchlist item. If the item already exists, the existing item is returned.

#### DELETE `/watchlists/:movieId`

- Response `200`:

```json
{ "message": "Removed from watchlist" }
```

#### GET `/watchlists`

- Response `200`: array of watchlist items, with `movieId` populated.

---

### Recommendation (`/recommendation`)

These endpoints proxy to the recommender service configured via `RECOMMENDER_SERVICE_URL` and cache results in Redis (see [server/src/modules/recommendation/recommendation.controller.js](server/src/modules/recommendation/recommendation.controller.js)).

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/recommendation/for-you` | Yes | Personalized recommendations (cached per user) |
| POST | `/recommendation/hybrid` | Yes | Hybrid recommendations for a user + target movie (cached per user/movie) |
| POST | `/recommendation/similar` | No | Similar movies; accepts guests (requires `tmdbId`) |
| GET | `/recommendation/trending` | No | Trending discovery (cached globally) |
| GET | `/recommendation/discover` | No | Discovery by country/genre/person/top-rated (cached by query) |
| GET | `/recommendation/metadata` | No | Metadata for `genres` or `countries` |
| GET | `/recommendation/genres` | No | Genres metadata |
| GET | `/recommendation/countries` | No | Countries metadata |

#### GET `/recommendation/for-you?limit=20`

- Query params:
  - `limit` (optional, default 20)
- Response `200`: proxied recommender payload, e.g.:

```json
{ "success": true, "data": [] }
```

#### POST `/recommendation/hybrid`

- Request body:

```json
{ "tmdbId": 862, "limit": 10 }
```

- Response `200`: proxied recommender payload.

#### POST `/recommendation/similar`

- Request body:

```json
{ "tmdbId": 862, "limit": 10 }
```

- Response `200`: proxied recommender payload.
- If `tmdbId` is missing: `400` with `{ "message": "tmdbId is required" }`.

#### GET `/recommendation/trending?timeWindow=week&limit=20`

- Query params:
  - `timeWindow` (optional, default `week`)
  - `limit` (optional, default 20)
- Response `200`: proxied recommender payload.

#### GET `/recommendation/discover`

- Query params:
  - `type` (required): `country` | `genre` | `person` | `top-rated`
  - `value` (used by `country` and `genre`)
  - `personId` (used by `person`)
  - `page` (optional, default 1)
  - `limit` (optional, default 20)

- Response `200`: proxied recommender payload. For paged discovery, the recommender can return a `pagination` object.

#### GET `/recommendation/metadata?type=genres|countries`

- Query params:
  - `type` (required): `genres` or `countries`
- Response `200`: proxied recommender payload.
- Invalid `type`: `400` with `{ "message": "Invalid metadata type" }`.

---

## Authentication & Authorization

### JWT cookie authentication

Authentication is implemented using JWTs:

- Tokens are signed with `JWT_SECRET` and have a 7-day expiry.
- On login/register, the backend sets the JWT in an HttpOnly cookie named `accessToken` (with `secure: true` and `sameSite: "None"`).
- Protected routes use the custom `protect` middleware in [server/src/middlewares/auth.middleware.js](server/src/middlewares/auth.middleware.js), which:
  - reads `req.cookies.accessToken`
  - verifies the JWT
  - loads the user from MongoDB and assigns `req.user`

### Token revocation (blacklist)

- Logout inserts the current token into the blacklist collection defined in [server/src/modules/auth/blacklist.schema.js](server/src/modules/auth/blacklist.schema.js).
- The blacklist collection is configured with a TTL index on `expiresAt`.

### Role-based authorization

- An `admin` middleware exists in [server/src/middlewares/auth.middleware.js](server/src/middlewares/auth.middleware.js) but is not used by any routes.

### Passport strategy

- A Passport-JWT strategy is configured in [server/src/config/passport.js](server/src/config/passport.js), including a blacklist check.
- Current route protection does not use Passport; it uses the custom `protect` middleware.

---

## Database Design

MongoDB collections (Mongoose models):

- Users: [server/src/modules/users/users.schema.js](server/src/modules/users/users.schema.js)
- Movies: [server/src/modules/movies/movies.schema.js](server/src/modules/movies/movies.schema.js)
- Ratings: [server/src/modules/ratings/ratings.schema.js](server/src/modules/ratings/ratings.schema.js)
- Watchlists: [server/src/modules/watchlists/watchlists.schema.js](server/src/modules/watchlists/watchlists.schema.js)
- Token blacklist: [server/src/modules/auth/blacklist.schema.js](server/src/modules/auth/blacklist.schema.js)

Relationships:

- `ratings`: references `users` and `movies` (unique compound index on `userId` + `movieId`)
- `watchlists`: references `users` and `movies` (unique compound index on `userId` + `movieId`)

The `movies` model includes fields to combine TMDB vote stats with user rating stats to compute a weighted `voteAverage` used for sorting.
