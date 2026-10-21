# GrandStay

A full-stack hotel management system for rooms, guests and reservations. The web app is a Next.js dashboard, the API is ASP.NET Core 8, and data lives in MongoDB.

## Features

- JWT authentication with role-aware demo accounts (admin, manager, front desk)
- Dashboard with occupancy, arrivals/departures, revenue chart and room mix
- Room management: create, edit, delete, filter, and housekeeping status
- Guest profiles: create, edit, delete and search
- Reservations: create, edit, cancel, check-in and check-out
- Availability checks that prevent overlapping bookings for the same room
- Responsive layout with mobile card views, modals and toast notifications
- Seeded demo data on first start (16 rooms, 8 guests, 15 reservations)
- Swagger UI for exploring the API

## Tech stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript   |
| Styling  | Tailwind CSS 4, custom components, lucide-react |
| API      | ASP.NET Core 8 Web API, JWT bearer auth         |
| Database | MongoDB 7 with the official .NET driver         |
| Tooling  | ESLint, Docker, Docker Compose                  |

## Project structure

```text
grandstay/
├── api/                    # ASP.NET Core Web API
│   ├── Controllers/        # Auth, rooms, guests, bookings, dashboard
│   ├── Dtos/               # Request/response contracts
│   ├── Models/             # MongoDB documents
│   ├── Services/           # Mongo, JWT, mapping, seeding, bookings
│   └── Dockerfile
├── web/                    # Next.js application
│   ├── src/app/            # Login and authenticated app routes
│   ├── src/components/     # UI, layout, charts, booking form
│   ├── src/lib/            # API client, types, formatters
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick start (local)

### Prerequisites

- .NET SDK 8.0
- Node.js 20.9+ (22 recommended)
- MongoDB 6+ (7 recommended)

### 1. Start MongoDB

```bash
mkdir -p .mongo-data
mongod --dbpath .mongo-data --fork --logpath .mongo-data/mongod.log
```

### 2. Start the API

```bash
dotnet run --project api
```

The API listens on <http://localhost:5000> and Swagger is at <http://localhost:5000/swagger>. On first start it creates indexes and seeds demo data. If the SDK was installed into `~/.dotnet`, run `export PATH="$HOME/.dotnet:$PATH"` first.

### 3. Start the web app

```bash
cd web
npm install
npm run dev
```

Open <http://localhost:3000>. If port 3000 is in use, Next.js picks the next free port (3001 is already allowed by CORS). To point at a different API, create `web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Demo accounts

| Role       | Email                     | Password      |
| ---------- | ------------------------- | ------------- |
| Admin      | `admin@grandstay.com`     | `admin123`    |
| Manager    | `manager@grandstay.com`   | `manager123`  |
| Front desk | `frontdesk@grandstay.com` | `frontdesk123`|

## Docker Compose

```bash
cp .env.example .env        # optional, but change JWT_KEY before deploying
docker compose up --build
```

| Service | URL / port                          | Notes                          |
| ------- | ----------------------------------- | ------------------------------ |
| Web     | <http://localhost:3001>             | Production Next.js build       |
| API     | <http://localhost:5000>             | Swagger at `/swagger`          |
| MongoDB | internal `mongo:27017`              | Not published to the host      |

The web image is built with `NEXT_PUBLIC_API_URL=http://localhost:5000/api`, so the browser talks to the published API port. The web app is exposed on **3001** because the local dev setup uses 3000; change the `web.ports` mapping and the CORS origin in `docker-compose.yml` if you prefer 3000.

Stop the stack with `docker compose down`. Add `-v` to also delete the MongoDB volume and reseed on the next start:

```bash
docker compose down -v
```

## Configuration

| Setting                       | Default (local)                   | Purpose                              |
| ----------------------------- | --------------------------------- | ------------------------------------ |
| `MongoDB:ConnectionString`    | `mongodb://127.0.0.1:27017`       | MongoDB connection                   |
| `MongoDB:Database`            | `grandstay`                       | Database name                        |
| `Jwt:Key`                     | dev key in `appsettings.json`     | Token signing key (change for prod)  |
| `Jwt:Issuer` / `Jwt:Audience` | `GrandStay.Api` / `GrandStay.Web` | Token validation                     |
| `Jwt:ExpiryHours`             | `12`                              | Token lifetime                       |
| `Cors:AllowedOrigins`         | localhost/127.0.0.1 on 3000/3001  | Allowed browser origins              |
| `NEXT_PUBLIC_API_URL`         | `http://localhost:5000/api`       | API base URL baked into the web build|

In Docker, override .NET settings with double-underscore environment variables (`MongoDB__ConnectionString`, `Jwt__Key`, `Cors__AllowedOrigins__0`, ...). See `docker-compose.yml` and `.env.example`.

## API overview

All routes except login are protected by a bearer token. Interactive docs: <http://localhost:5000/swagger>.

| Method | Route                        | Description                          |
| ------ | ---------------------------- | ------------------------------------ |
| POST   | `/api/auth/login`            | Sign in, returns JWT and user        |
| GET    | `/api/auth/me`               | Current user                         |
| GET    | `/api/dashboard/stats`       | Dashboard metrics and chart data     |
| GET    | `/api/rooms`                 | List/filter rooms                    |
| GET    | `/api/rooms/{id}`            | Room details                         |
| POST   | `/api/rooms`                 | Create room                          |
| PUT    | `/api/rooms/{id}`            | Update room                          |
| PATCH  | `/api/rooms/{id}/status`     | Update housekeeping status           |
| DELETE | `/api/rooms/{id}`           | Delete room                          |
| GET    | `/api/guests`                | List/search guests                   |
| GET    | `/api/guests/{id}`           | Guest details                        |
| POST   | `/api/guests`                | Create guest                         |
| PUT    | `/api/guests/{id}`           | Update guest                         |
| DELETE | `/api/guests/{id}`          | Delete guest                         |
| GET    | `/api/bookings`              | List/filter reservations             |
| GET    | `/api/bookings/availability` | Check available rooms for dates      |
| GET    | `/api/bookings/{id}`         | Reservation details                  |
| POST   | `/api/bookings`              | Create reservation                   |
| PUT    | `/api/bookings/{id}`         | Update reservation                   |
| PATCH  | `/api/bookings/{id}/status`  | Check in/out or cancel               |
| DELETE | `/api/bookings/{id}`         | Delete reservation                   |

## Quality checks

```bash
dotnet build api
cd web && npm run lint && npx tsc --noEmit && npm run build
```

## Notes

- Demo data is seeded only when the collections are empty. To reset locally, run `mongosh grandstay --eval 'db.dropDatabase()'` and restart the API.
- Change `Jwt:Key` (and the `JWT_KEY` in `.env`) before deploying anywhere public.
- Swagger is intentionally enabled for this demo; disable it for a production deployment.
- CORS is restricted to the listed local origins. Add your deployed web origin via configuration.
