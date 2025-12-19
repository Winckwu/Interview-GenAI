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

    // Run all migration files in order
    const migrationFiles = [
      'migrations.sql',
      'migrations_message_branches.sql',
      'migrations_pattern_enhancement.sql',
      'migrations_mr1_history.sql',
      'migrations_mr_history.sql',
      'migrations_reasoning.sql',
      'migrations_conversation_tree.sql',
    ];

    for (const migrationFile of migrationFiles) {
      const migrationPath = path.join(__dirname, migrationFile);
      if (fs.existsSync(migrationPath)) {
        const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

        const migrationStatements = migrationSql
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
              console.warn(`⚠️  Warning executing ${migrationFile}: ${err.message}`);
            }
          }
        }

        console.log(`✓ Migration applied: ${migrationFile}`);
      }
    }

    console.log('✓ Database initialization complete');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    throw err;
  }
};
