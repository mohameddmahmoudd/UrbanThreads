#!/bin/bash

cd "$(dirname "$0")" || exit 1

echo "----------------------------------------"
echo "  UrbanThreads - Starting the app..."
echo "----------------------------------------"

# Check if Docker Desktop is running
if ! docker info > /dev/null 2>&1; then
  echo ""
  echo "ERROR: Docker Desktop is not running."
  echo "Please open Docker Desktop and wait for it to finish starting, then try again."
  echo ""
  read -r -p "Press Enter to exit..."
  exit 1
fi

echo ""
echo "Docker is running. Building and starting services..."
echo "(This may take several minutes the first time)"
echo ""

# Start all services in detached mode
docker compose --env-file .env.docker up --build -d

echo ""
echo "Waiting for the app to be ready..."

# Wait until the backend signals it is fully up
docker compose --env-file .env.docker logs -f 2>/dev/null | grep -m1 "Backend running" > /dev/null

echo ""
echo "App is ready! Opening in your browser..."
open http://localhost:3000
echo ""
echo "If the browser did not open, navigate to: http://localhost:3000"
echo ""
echo "To stop the app, run start.sh again or double-click stop.sh"
