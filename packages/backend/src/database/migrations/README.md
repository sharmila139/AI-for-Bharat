# Database Migrations

This directory contains database migration files for RuralConnect AI using a version-controlled migration system.

## Migration Naming Convention

Migrations follow the format: `V{version}__{description}.sql`

Example: `V001__initial_schema.sql`

## Migration Order

Migrations are executed in version order:

1. `V001__initial_users_auth.sql` - Users and authentication tables
2. `V002__agriculture_module.sql` - Agriculture module tables
3. `V003__health_module.sql` - Health module tables
4. `V004__education_module.sql` - Education module tables
5. `V005__infrastructure_module.sql` - Infrastructure module tables
6. `V006__indexes_optimization.sql` - Additional indexes
7. `V007__seed_data.sql` - Initial seed data

## Running Migrations

### Using node-pg-migrate

```bash
# Install migration tool
npm install node-pg-migrate

# Run all pending migrations
npm run migrate up

# Rollback last migration
npm run migrate down

# Create new migration
npm run migrate create migration_name
```

### Manual Execution

```bash
# Connect to PostgreSQL
psql -U ruralconnect_user -d ruralconnect_db

# Execute migration file
\i packages/backend/src/database/migrations/V001__initial_users_auth.sql
```

## Migration Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "migrate": "node-pg-migrate",
    "migrate:up": "node-pg-migrate up",
    "migrate:down": "node-pg-migrate down",
    "migrate:create": "node-pg-migrate create"
  }
}
```

## Migration Tracking

Migrations are tracked in the `pgmigrations` table:

```sql
CREATE TABLE IF NOT EXISTS pgmigrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Best Practices

1. **Never modify executed migrations** - Create new migrations for changes
2. **Test migrations** - Test both up and down migrations
3. **Backup before migration** - Always backup production data
4. **Idempotent migrations** - Use `IF NOT EXISTS` and `IF EXISTS`
5. **Rollback plan** - Ensure down migrations work correctly
6. **Version control** - Commit migrations to git
7. **Sequential execution** - Run migrations in order

## Migration Template

```sql
-- Migration: V{version}__{description}
-- Created: {date}
-- Description: {detailed description}

-- Up Migration
BEGIN;

-- Your schema changes here
CREATE TABLE IF NOT EXISTS example_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track migration
INSERT INTO pgmigrations (name) VALUES ('V{version}__{description}');

COMMIT;

-- Down Migration (for rollback)
-- BEGIN;
-- DROP TABLE IF EXISTS example_table;
-- DELETE FROM pgmigrations WHERE name = 'V{version}__{description}';
-- COMMIT;
```

## Environment-Specific Migrations

### Development
```bash
DATABASE_URL=postgresql://localhost:5432/ruralconnect_dev npm run migrate up
```

### Staging
```bash
DATABASE_URL=postgresql://staging-host:5432/ruralconnect_staging npm run migrate up
```

### Production
```bash
DATABASE_URL=postgresql://prod-host:5432/ruralconnect_prod npm run migrate up
```

## Troubleshooting

### Migration Failed
1. Check error logs
2. Verify database connection
3. Check for syntax errors
4. Ensure prerequisites are met
5. Rollback if necessary

### Rollback Migration
```bash
npm run migrate down
```

### Reset Database (Development Only)
```bash
# Drop all tables
psql -U ruralconnect_user -d ruralconnect_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-run all migrations
npm run migrate up
```

## Migration Checklist

Before running migrations in production:

- [ ] Backup database
- [ ] Test migration in staging
- [ ] Review migration SQL
- [ ] Check for breaking changes
- [ ] Verify rollback procedure
- [ ] Schedule maintenance window
- [ ] Notify team
- [ ] Monitor execution
- [ ] Verify data integrity
- [ ] Update documentation
