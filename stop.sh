#!/bin/bash

# Always run from the folder where this script lives
cd "$(dirname "$0")" || exit 1

echo "----------------------------------------"
echo "  UrbanThreads - Stopping the app..."
echo "----------------------------------------"
echo ""

docker compose --env-file .env.docker down

echo ""
echo "App stopped. You can close this window."
