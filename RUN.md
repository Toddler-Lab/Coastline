# Coastline Local Runner Scripts

## PostgreSQL Database (Docker)

### 1. Start Database Container:
```powershell
pnpm db:up
```
> Starts the PostgreSQL 16 container via Docker Compose and ensures `coastline_dev` and `coastline_test` exist.

### 2. Run Migrations & Seed:
```powershell
pnpm db:migrate
pnpm db:seed
```
*(Or run `pnpm db:setup` to start the container, apply migrations, and seed in one step)*

### 3. Stop Database Container:
```powershell
pnpm db:down
```

> **Note on Port 5432 Conflict:**  
> If you have a native PostgreSQL instance running on port 5432, set `POSTGRES_PORT=5433` in `.env` and update the port in `DATABASE_URL` and `TEST_DATABASE_URL` to `5433`.

---

## Run All Dev Servers:
```powershell
pnpm dev
```
- **Web App**: http://localhost:3000
- **API Health**: http://localhost:3001/health/live
- **Swagger OpenAPI Docs**: http://localhost:3001/api/docs
