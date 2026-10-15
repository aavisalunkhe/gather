# Gather — Event Studio

A full-stack event discovery and RSVP app built with MongoDB, Express, React, and Node.

## Run locally

1. Install Node.js 20+ and MongoDB (or create a MongoDB Atlas cluster).
2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.
3. From the project root run `npm install`, then `npm run dev`.
4. Open the Vite URL printed in the terminal. The Express API runs on port 5000.

## Deploy

This project is configured as one Render web service: it builds the React app, serves it from Express, and exposes the API on the same origin. Push the project to a GitHub repository, create a new Render Blueprint from `render.yaml`, and set `MONGODB_URI` to a MongoDB Atlas connection string. Render supplies `PORT` automatically.

Create the MongoDB database in Atlas and allow connections from the Render service. Keep the connection string in Render’s environment settings; do not commit it to the repository.

The API seeds a small set of sample listings the first time it connects to an empty database. Use the event form in the app to publish events; each listing supports RSVP and attendee count updates.
