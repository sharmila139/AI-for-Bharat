#!/usr/bin/env node

/**
 * Database Migration Runner
 * 
 * Simple migration system for RuralConnect AI
 * Executes SQL migration files in version order
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const SCHEMAS_DIR = path.join(__dirname, 'schemas');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ruralconnect_db',
  user: process.env.DB_USER || 'ruralconnect_user',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

class MigrationRunner {
  constructor() {
    this.client = new Client(dbConfig);
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✓ Connected to database');
    } catch (error) {
      console.error('✗ Database connection failed:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('✓ Disconnected from database');
  }

  async ensureMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS pgmigrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        run_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.client.query(query);
  }

  async getExecutedMigrations() {
    const result = await this.client.query(
      'SELECT name FROM pgmigrations ORDER BY id'
    );
    return result.rows.map(row => row.name);
  }

  async getPendingMigrations() {
    const executed = await this.getExecutedMigrations();
    const allMigrations = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql') && file.startsWith('V'))
      .sort();

    return allMigrations.filter(
      migration => !executed.includes(migration.replace('.sql', ''))
    );
  }

  async executeMigration(migrationFile) {
    const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
    const migrationName = migrationFile.replace('.sql', '');

    console.log(`\n→ Executing migration: ${migrationName}`);

    try {
      let sql = fs.readFileSync(migrationPath, 'utf8');

      // Replace \i directives with actual file content
      const includeRegex = /\\i\s+(.+\.sql)/g;
      let match;
      while ((match = includeRegex.exec(sql)) !== null) {
        const includePath = match[1];
        const fullPath = path.resolve(MIGRATIONS_DIR, includePath);
        
        if (fs.existsSync(fullPath)) {
          const includeContent = fs.readFileSync(fullPath, 'utf8');
          sql = sql.replace(match[0], includeContent);
        }
      }

      await this.client.query(sql);
      console.log(`✓ Migration ${migrationName} executed successfully`);
    } catch (error) {
      console.error(`✗ Migration ${migrationName} failed:`, error.message);
      throw error;
    }
  }

  async runMigrations() {
    console.log('\n=== RuralConnect AI Database Migration ===\n');

    await this.ensureMigrationsTable();

    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      console.log('✓ No pending migrations');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):`);
    pending.forEach(m => console.log(`  - ${m}`));

    for (const migration of pending) {
      await this.executeMigration(migration);
    }

    console.log('\n✓ All migrations completed successfully\n');
  }

  async showStatus() {
    console.log('\n=== Migration Status ===\n');

    await this.ensureMigrationsTable();

    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();

    console.log(`Executed migrations: ${executed.length}`);
    if (executed.length > 0) {
      executed.forEach(m => console.log(`  ✓ ${m}`));
    }

    console.log(`\nPending migrations: ${pending.length}`);
    if (pending.length > 0) {
      pending.forEach(m => console.log(`  ○ ${m}`));
    }

    console.log('');
  }

  async createMigration(name) {
    if (!name) {
      console.error('✗ Migration name is required');
      console.log('Usage: npm run migrate:create <migration_name>');
      process.exit(1);
    }

    const executed = await this.getExecutedMigrations();
    const allMigrations = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql') && file.startsWith('V'));

    // Get next version number
    let maxVersion = 0;
    allMigrations.forEach(file => {
      const match = file.match(/^V(\d+)__/);
      if (match) {
        const version = parseInt(match[1]);
        if (version > maxVersion) maxVersion = version;
      }
    });

    const nextVersion = String(maxVersion + 1).padStart(3, '0');
    const fileName = `V${nextVersion}__${name}.sql`;
    const filePath = path.join(MIGRATIONS_DIR, fileName);

    const template = `-- Migration: V${nextVersion}__${name}
-- Created: ${new Date().toISOString().split('T')[0]}
-- Description: ${name.replace(/_/g, ' ')}

BEGIN;

-- Your schema changes here


-- Track migration
INSERT INTO pgmigrations (name, run_on) 
VALUES ('V${nextVersion}__${name}', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Down Migration (for rollback)
-- BEGIN;
-- -- Rollback changes here
-- DELETE FROM pgmigrations WHERE name = 'V${nextVersion}__${name}';
-- COMMIT;
`;

    fs.writeFileSync(filePath, template);
    console.log(`✓ Created migration: ${fileName}`);
  }
}

// CLI
async function main() {
  const command = process.argv[2] || 'up';
  const arg = process.argv[3];

  const runner = new MigrationRunner();

  try {
    await runner.connect();

    switch (command) {
      case 'up':
        await runner.runMigrations();
        break;
      case 'status':
        await runner.showStatus();
        break;
      case 'create':
        await runner.createMigration(arg);
        break;
      default:
        console.log('Usage:');
        console.log('  npm run migrate up      - Run pending migrations');
        console.log('  npm run migrate status  - Show migration status');
        console.log('  npm run migrate create <name> - Create new migration');
    }
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await runner.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = MigrationRunner;
