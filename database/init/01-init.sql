-- Initialize Lingvar database

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions to user
GRANT ALL PRIVILEGES ON DATABASE lingvar TO lingvar_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lingvar_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lingvar_user;

-- This file will be executed when the PostgreSQL container starts for the first time
