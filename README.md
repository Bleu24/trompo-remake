# Trompo Remake

This repository contains both the backend and frontend for the Trompo project.

## Required Environment Variables

Set the following variables in a `.env` file or in your shell before starting the backend:

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - secret used to sign JWT tokens
- `PORT` - port for the Express server

## Backend Setup

```bash
cd backend
npm install
```

Useful scripts defined in [`backend/package.json`](backend/package.json):

- `npm run dev` – start the server with Nodemon for development
- `npm start` – run the server normally
- `npm test` – run Jest tests

## Frontend Setup

```bash
cd frontend
npm install
```

Useful scripts defined in [`frontend/package.json`](frontend/package.json):

- `npm run dev` – run the Next.js development server
- `npm run build` – build the production bundle
- `npm start` – start the production server
- `npm run lint` – run ESLint

## Running Tests

Backend tests are located in `backend/tests`. Run them with:

```bash
cd backend
npm test
```

There are currently no automated tests for the frontend.
