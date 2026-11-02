# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY ["MapAppApi.csproj", "./"]
RUN dotnet restore "MapAppApi.csproj"

# Copy the remaining source files
COPY . .
RUN dotnet publish "MapAppApi.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "dotnet MapAppApi.dll --urls http://0.0.0.0:${PORT:-8080}"]
