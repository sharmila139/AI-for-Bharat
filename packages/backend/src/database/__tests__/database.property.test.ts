import * as fc from 'fast-check';
import { QueryRouter } from '../read-replica-config';

describe('Database Property Tests', () => {
  describe('Property 42: Query Routing by Type', () => {
    let queryRouter: QueryRouter;

    beforeEach(() => {
      queryRouter = new QueryRouter();
    });

    it('should route SELECT queries to read replicas', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (columns, tableName) => {
            const selectQueries = [
              `SELECT ${columns.join(', ')} FROM ${tableName}`,
              `SELECT * FROM ${tableName}`,
              `SELECT COUNT(*) FROM ${tableName}`,
              `  SELECT ${columns[0]} FROM ${tableName}  `, // With whitespace
              `select ${columns[0]} from ${tableName}`, // Lowercase
            ];

            for (const query of selectQueries) {
              // Property: SELECT queries should be identified as read queries
              const isRead = (queryRouter as any).isReadQuery(query);
              if (!isRead) {
                console.log('Failed query:', query);
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should route INSERT/UPDATE/DELETE queries to primary', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.record({
            col1: fc.string(),
            col2: fc.integer(),
          }),
          (tableName, data) => {
            const writeQueries = [
              `INSERT INTO ${tableName} (col1, col2) VALUES ('${data.col1}', ${data.col2})`,
              `UPDATE ${tableName} SET col1 = '${data.col1}' WHERE col2 = ${data.col2}`,
              `DELETE FROM ${tableName} WHERE col2 = ${data.col2}`,
              `  INSERT INTO ${tableName} VALUES ('test')  `, // With whitespace
              `insert into ${tableName} values ('test')`, // Lowercase
            ];

            for (const query of writeQueries) {
              // Property: Write queries should NOT be identified as read queries
              const isRead = (queryRouter as any).isReadQuery(query);
              if (isRead) {
                console.log('Failed query:', query);
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should route SELECT FOR UPDATE to primary', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (tableName, column) => {
            const lockingQueries = [
              `SELECT * FROM ${tableName} FOR UPDATE`,
              `SELECT ${column} FROM ${tableName} FOR UPDATE`,
              `SELECT * FROM ${tableName} FOR SHARE`,
              `  SELECT * FROM ${tableName} FOR UPDATE  `,
            ];

            for (const query of lockingQueries) {
              // Property: Locking SELECT queries should NOT be read queries
              const isRead = (queryRouter as any).isReadQuery(query);
              if (isRead) {
                console.log('Failed query:', query);
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should handle mixed case and whitespace correctly', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('SELECT', 'select', 'Select', 'SeLeCt'),
          fc.constantFrom('INSERT', 'insert', 'Insert', 'InSeRt'),
          fc.nat({ max: 10 }),
          (selectKeyword, insertKeyword, spaces) => {
            const whitespace = ' '.repeat(spaces);
            
            const selectQuery = `${whitespace}${selectKeyword} * FROM users${whitespace}`;
            const insertQuery = `${whitespace}${insertKeyword} INTO users VALUES (1)${whitespace}`;

            // Property: Case and whitespace should not affect routing
            const selectIsRead = (queryRouter as any).isReadQuery(selectQuery);
            const insertIsRead = (queryRouter as any).isReadQuery(insertQuery);

            return selectIsRead === true && insertIsRead === false;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should correctly identify complex SELECT queries', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (table1, table2) => {
            const complexQueries = [
              `SELECT a.*, b.* FROM ${table1} a JOIN ${table2} b ON a.id = b.id`,
              `SELECT COUNT(*) FROM ${table1} WHERE id > 10`,
              `SELECT * FROM ${table1} WHERE name LIKE '%test%'`,
              `SELECT DISTINCT column FROM ${table1}`,
              `SELECT * FROM ${table1} ORDER BY id DESC LIMIT 10`,
              `SELECT * FROM ${table1} GROUP BY category HAVING COUNT(*) > 5`,
            ];

            for (const query of complexQueries) {
              const isRead = (queryRouter as any).isReadQuery(query);
              if (!isRead) {
                console.log('Failed query:', query);
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 50, seed: 42 }
      );
    });

    it('should handle subqueries correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (tableName) => {
            const subqueryQueries = [
              `SELECT * FROM ${tableName} WHERE id IN (SELECT id FROM other_table)`,
              `SELECT * FROM (SELECT * FROM ${tableName}) AS subquery`,
            ];

            for (const query of subqueryQueries) {
              const isRead = (queryRouter as any).isReadQuery(query);
              if (!isRead) {
                console.log('Failed query:', query);
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 50, seed: 42 }
      );
    });

    it('should handle transaction control statements', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('BEGIN', 'COMMIT', 'ROLLBACK', 'START TRANSACTION'),
          (statement) => {
            // Property: Transaction control should NOT be read queries
            const isRead = (queryRouter as any).isReadQuery(statement);
            return isRead === false;
          }
        ),
        { numRuns: 50, seed: 42 }
      );
    });

    it('should handle DDL statements correctly', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (tableName) => {
            const ddlStatements = [
              `CREATE TABLE ${tableName} (id INT)`,
              `ALTER TABLE ${tableName} ADD COLUMN name VARCHAR(255)`,
              `DROP TABLE ${tableName}`,
              `TRUNCATE TABLE ${tableName}`,
            ];

            for (const statement of ddlStatements) {
              // Property: DDL statements should NOT be read queries
              const isRead = (queryRouter as any).isReadQuery(statement);
              if (isRead) {
                console.log('Failed statement:', statement);
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 50, seed: 42 }
      );
    });

    it('should be consistent for the same query', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }),
          (query) => {
            // Property: Same query should always route the same way
            const result1 = (queryRouter as any).isReadQuery(query);
            const result2 = (queryRouter as any).isReadQuery(query);
            const result3 = (queryRouter as any).isReadQuery(query);

            return result1 === result2 && result2 === result3;
          }
        ),
        { numRuns: 100, seed: 42 }
      );
    });

    it('should handle empty and whitespace-only queries', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 20 }),
          (spaces) => {
            const whitespaceQuery = ' '.repeat(spaces);
            
            // Property: Empty/whitespace queries should not crash
            try {
              const isRead = (queryRouter as any).isReadQuery(whitespaceQuery);
              return typeof isRead === 'boolean';
            } catch (error) {
              return false;
            }
          }
        ),
        { numRuns: 50, seed: 42 }
      );
    });

    it('should handle queries with comments', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (tableName) => {
            const queriesWithComments = [
              `-- This is a comment\nSELECT * FROM ${tableName}`,
              `/* Multi-line\n   comment */\nSELECT * FROM ${tableName}`,
              `SELECT * FROM ${tableName} -- inline comment`,
            ];

            for (const query of queriesWithComments) {
              const isRead = (queryRouter as any).isReadQuery(query);
              // Property: Comments should not affect routing
              if (!isRead) {
                console.log('Failed query:', query);
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 50, seed: 42 }
      );
    });
  });
});
