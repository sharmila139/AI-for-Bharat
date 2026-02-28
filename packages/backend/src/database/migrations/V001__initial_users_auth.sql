-- Migration: V001__initial_users_auth
-- Created: 2026-02-27
-- Description: Initial schema for users and authentication

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "cube";
CREATE EXTENSION IF NOT EXISTS "earthdistance";

-- Create pgmigrations table if not exists
CREATE TABLE IF NOT EXISTS pgmigrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Execute the users and auth schema
\i ../schemas/01_users_auth.sql

-- Track migration
INSERT INTO pgmigrations (name, run_on) 
VALUES ('V001__initial_users_auth', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

COMMIT;
