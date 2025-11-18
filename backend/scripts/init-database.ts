/**
 * Database Initialization Script
 * Initializes the PostgreSQL database with required tables and schemas
 * Run with: npx ts-node scripts/init-database.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

/**
 * Initialize database with SQL schema
 */
async function initializeDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'interview_genai',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('🔄 Connecting to database...');

    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, '../src/config/init.sql');

    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found at ${sqlFilePath}`);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    console.log('📄 SQL file loaded');

    // Split SQL statements and execute them
    // Handle both semicolon-separated and regular statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        await pool.query(statement);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (error: any) {
        // Some statements might fail if objects already exist
        // This is expected behavior for idempotent init scripts
        if (error.code === '42P07' || error.code === '42701' || error.code === '42P06') {
          console.log(`⚠ Statement ${i + 1}/${statements.length} skipped (object already exists)`);
        } else if (error.message.includes('already exists')) {
          console.log(`⚠ Statement ${i + 1}/${statements.length} skipped (object already exists)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Database initialization completed successfully!');
    console.log('📝 All required tables and indexes have been created.\n');

  } catch (error) {
    console.error('\n❌ Database initialization failed:');
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error(error);
    }
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Run initialization
initializeDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
