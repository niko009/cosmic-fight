#!/bin/sh
set -eu

VERSION_FILE=/app/wwwroot/version.json
if [ -f "$VERSION_FILE" ]; then
  APP_BUILD_VERSION="$(sed -n 's/.*"version":[[:space:]]*"\([^"]*\)".*/\1/p' "$VERSION_FILE" | head -n 1)"
  APP_BUILD_COMMIT="$(sed -n 's/.*"commit":[[:space:]]*"\([^"]*\)".*/\1/p' "$VERSION_FILE" | head -n 1)"
  if [ -n "$APP_BUILD_VERSION" ]; then export App__Version="$APP_BUILD_VERSION"; fi
  if [ -n "$APP_BUILD_COMMIT" ]; then export App__Commit="$APP_BUILD_COMMIT"; fi
fi

exec dotnet CosmicFight.Server.dll
