FROM node:22-alpine AS web-build
RUN apk add --no-cache git
WORKDIR /src
COPY .git ./.git
WORKDIR /src/web
COPY web/package.json ./
RUN npm install --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS server-build
WORKDIR /src
COPY server/CosmicFight.Server.csproj server/
RUN dotnet restore server/CosmicFight.Server.csproj
COPY server/ server/
RUN dotnet publish server/CosmicFight.Server.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=server-build /app/publish ./
COPY --from=web-build /src/web/dist ./wwwroot
COPY docker-entrypoint.sh ./docker-entrypoint.sh
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["/app/docker-entrypoint.sh"]
