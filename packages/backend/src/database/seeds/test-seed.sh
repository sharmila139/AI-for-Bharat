#!/bin/bash

# Test script for knowledge base seed
# This script tests the seed functionality without requiring a full database setup

echo "==================================="
echo "Knowledge Base Seed Test"
echo "==================================="
echo ""

# Check if required environment variables are set
if [ -z "$DB_HOST" ]; then
    echo "⚠️  DB_HOST not set, using default: localhost"
    export DB_HOST=localhost
fi

if [ -z "$DB_PORT" ]; then
    echo "⚠️  DB_PORT not set, using default: 5432"
    export DB_PORT=5432
fi

if [ -z "$DB_NAME" ]; then
    echo "⚠️  DB_NAME not set, using default: ruralconnect"
    export DB_NAME=ruralconnect
fi

if [ -z "$DB_USER" ]; then
    echo "⚠️  DB_USER not set, using default: postgres"
    export DB_USER=postgres
fi

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ DB_PASSWORD must be set"
    echo ""
    echo "Usage:"
    echo "  export DB_PASSWORD=your_password"
    echo "  ./test-seed.sh"
    exit 1
fi

echo ""
echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Test database connection
echo "Testing database connection..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ Cannot connect to database"
    echo ""
    echo "Please ensure:"
    echo "  1. PostgreSQL is running"
    echo "  2. Database '$DB_NAME' exists"
    echo "  3. User '$DB_USER' has access"
    echo "  4. Password is correct"
    exit 1
fi

echo "✅ Database connection successful"
echo ""

# Check if knowledge_articles table exists
echo "Checking if knowledge_articles table exists..."
TABLE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'knowledge_articles');")

if [ "$TABLE_EXISTS" != "t" ]; then
    echo "❌ Table 'knowledge_articles' does not exist"
    echo ""
    echo "Please run database migrations first:"
    echo "  npm run migrate:up"
    exit 1
fi

echo "✅ Table exists"
echo ""

# Check current article count
echo "Checking current article count..."
CURRENT_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM knowledge_articles;")
echo "Current articles in database: $CURRENT_COUNT"
echo ""

if [ "$CURRENT_COUNT" -gt 0 ]; then
    echo "⚠️  Warning: Database already contains $CURRENT_COUNT articles"
    echo ""
    read -p "Do you want to delete existing articles and reseed? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deleting existing articles..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "DELETE FROM knowledge_articles;" > /dev/null
        echo "✅ Existing articles deleted"
        echo ""
    else
        echo "Skipping seed (database already has articles)"
        exit 0
    fi
fi

# Run the seed script
echo "Running seed script..."
echo "==================================="
echo ""

cd "$(dirname "$0")/../../.."
npm run seed:knowledge-base

if [ $? -eq 0 ]; then
    echo ""
    echo "==================================="
    echo "✅ Seed completed successfully!"
    echo ""
    
    # Show final statistics
    echo "Final Statistics:"
    FINAL_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM knowledge_articles;")
    echo "  Total articles: $FINAL_COUNT"
    
    echo ""
    echo "To view articles, run:"
    echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"SELECT title->>'en' as title, category, evidence_level FROM knowledge_articles LIMIT 10;\""
else
    echo ""
    echo "❌ Seed failed"
    exit 1
fi
