/**
 * Database Initialization
 * Runs SQL schema creation and migrations on startup
 */

import pool from './database';
import fs from 'fs';
import path from 'path';

export const initializeDatabase = async () => {
  try {
    console.log('🔧 Initializing database schema...');

    // Read and execute init.sql
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf-8');

    // Split by semicolon and execute each statement
    const initStatements = initSql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of initStatements) {
      try {
        await pool.query(statement);
      } catch (err: any) {
        // Ignore errors if tables already exist
        if (err.code !== '42P07') {
          // 42P07 = table already exists
          console.warn(`⚠️  Warning executing init statement: ${err.message}`);
        }
      }
    }

    console.log('✓ Base schema initialized');

    // Read and execute migrations.sql
    const migrationsSqlPath = path.join(__dirname, 'migrations.sql');
    if (fs.existsSync(migrationsSqlPath)) {
      const migrationsSql = fs.readFileSync(migrationsSqlPath, 'utf-8');

      const migrationStatements = migrationsSql
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of migrationStatements) {
        try {
          await pool.query(statement);
        } catch (err: any) {
          // Ignore errors if tables/columns already exist
          if (err.code !== '42P07' && err.code !== '42701') {
            // 42701 = column already exists
            console.warn(`⚠️  Warning executing migration: ${err.message}`);
          }
        }
      }

      console.log('✓ Migrations applied');
    }

    console.log('✓ Database initialization complete');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    throw err;
  }
};
