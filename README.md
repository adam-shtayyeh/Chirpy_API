# Chirpy Backend API

A production-style RESTful backend API built with **TypeScript**, **Node.js**, **Express.js**, and **PostgreSQL**.

Chirpy allows users to create and manage short messages (chirps) with a complete authentication and authorization system using **JWT access tokens**, **refresh tokens**, and secure password hashing.

The project also includes webhook integration for **Chirpy Red subscriptions** using API key authentication.

---

# 🚀 Features

- User registration and authentication
- Secure password hashing using Argon2
- JWT access token authentication
- Refresh token system
- Token refresh and revocation
- Protected API routes
- User authorization and ownership validation
- Create, read, and delete chirps
- Update user profile information
- Chirpy Red membership system
- Payment webhook integration
- API key verification
- Filtering chirps by author
- Sorting chirps by creation date
- PostgreSQL database migrations

---

# 🛠 Technologies

## Backend

- TypeScript
- Node.js
- Express.js

## Database

- PostgreSQL
- Drizzle ORM
- Drizzle Kit

## Authentication & Security

- JSON Web Tokens (JWT)
- Refresh Tokens
- Argon2 Password Hashing
- API Key Authentication

## Testing

- Vitest

## Tools

- npm
- Git

---

# 🏗 Architecture

The project follows a separated backend structure:

```
src
│
├── db
│   ├── schema.ts        # Database schema
│   ├── index.ts         # Database connection
│   │
│   ├── queries
│   │   ├── users.ts
│   │   ├── chirps.ts
│   │   └── refreshTokens.ts
│   │
│   └── migrations       # Database migrations
│
├── auth.ts              # JWT and authentication logic
├── config.ts            # Environment configuration
├── errors.ts            # Error handling
└── index.ts             # Express server
```

---

# 📂 Project Structure

```
ts-web-server
│
├── src
│   │
│   ├── app
│   │   ├── assets
│   │   └── index.html
│   │
│   ├── db
│   │   ├── migrations
│   │   ├── queries
│   │   │   ├── chirps.ts
│   │   │   ├── refreshTokens.ts
│   │   │   └── users.ts
│   │   ├── index.ts
│   │   └── schema.ts
│   │
│   ├── auth.ts
│   ├── auth.test.ts
│   ├── config.ts
│   ├── errors.ts
│   └── index.ts
│
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

# ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/adam-shtayyeh/Chirpy_API.git

cd Chirpy_API
```

Install dependencies:

```bash
npm install
```

---

# 🔐 Environment Variables

Create a `.env` file:

```env
DB_URL=your_database_url

PLATFORM=your_platform_name

JWT_SECRET=your_jwt_secret

POLKA_KEY=your_polka_api_key
```

Make sure to never commit your `.env` file.

---

# 🗄 Database Setup

The project uses PostgreSQL with Drizzle ORM.

Generate migrations:

```bash
npx drizzle-kit generate
```

Apply migrations:

```bash
npx drizzle-kit migrate
```

---

# ▶️ Running the Project

Build:

```bash
npm run build
```

Start:

```bash
npm start
```

Development:

```bash
npm run dev
```

Server runs on:

```
http://localhost:8080
```

---

# 🔑 Authentication

## Login

```
POST /api/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response:

```json
{
  "id": "user-id",
  "email": "user@example.com",
  "token": "access-token",
  "refreshToken": "refresh-token"
}
```

---

## Protected Routes

Protected endpoints require:

```
Authorization: Bearer ACCESS_TOKEN
```

---

## Refresh Access Token

```
POST /api/refresh
```

Header:

```
Authorization: Bearer REFRESH_TOKEN
```

---

## Revoke Refresh Token

```
POST /api/revoke
```

Header:

```
Authorization: Bearer REFRESH_TOKEN
```

---

# 📡 API Endpoints

## Users

### Create User

```
POST /api/users
```

Body:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

---

### Update User

```
PUT /api/users
```

Allows authenticated users to update:

- Email
- Password

---

# Chirps

## Create Chirp

```
POST /api/chirps
```

Requires authentication.

Body:

```json
{
  "body": "Hello Chirpy!"
}
```

---

## Get Chirps

```
GET /api/chirps
```

Optional query parameters:

Filter by author:

```
GET /api/chirps?authorId=user-id
```

Sort:

```
GET /api/chirps?sort=asc
```

or

```
GET /api/chirps?sort=desc
```

---

## Get Single Chirp

```
GET /api/chirps/:id
```

---

## Delete Chirp

```
DELETE /api/chirps/:id
```

Only the owner of the chirp can delete it.

Response:

```
204 No Content
```

---

# ⭐ Chirpy Red Webhooks

The project supports webhook events from the payment provider.

Endpoint:

```
POST /api/polka/webhooks
```

Authentication:

```
Authorization: ApiKey POLKA_KEY
```

Example:

```json
{
  "event": "user.upgraded",
  "data": {
    "userId": "user-id"
  }
}
```

Successful processing returns:

```
204 No Content
```

---

# 🧪 Testing

Run tests:

```bash
npm run test
```

The project uses Vitest for automated testing.

---

# 🔒 Security

Implemented security features:

- Argon2 password hashing
- JWT validation
- Refresh token expiration
- Refresh token revocation
- Protected endpoints
- Ownership authorization
- API key validation for webhooks

---

# 📌 Future Improvements

Possible improvements:

- Add Swagger/OpenAPI documentation
- Add Docker support
- Add CI/CD pipeline
- Add rate limiting
- Add more integration tests



