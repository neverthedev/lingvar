# Lingvar - Language Learning Application

## Development Setup with Docker

### Prerequisites
- Docker
- Docker Compose

### Getting Started

1. **Clone the repository and navigate to the project directory**

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the applications**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - PostgreSQL: localhost:5432

### Services

- **PostgreSQL Database**: Runs on port 5432
  - Database: `lingvar`
  - User: `lingvar_user`
  - Password: `lingvar_password`
  - Data persisted in `./database/data/`

- **FastAPI Backend**: Runs on port 8000
  - Auto-reloads on code changes
  - Includes database models and connections

- **Next.js Frontend**: Runs on port 3000
  - Hot reloading enabled
  - Configured to proxy API requests to backend

### Useful Commands

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f [service_name]

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build

# Access database directly
docker-compose exec postgres psql -U lingvar_user -d lingvar
```

### Database Management

Database data is persisted in the `./database/data/` folder. To reset the database:

```bash
docker-compose down
sudo rm -rf database/data
docker-compose up --build
```
