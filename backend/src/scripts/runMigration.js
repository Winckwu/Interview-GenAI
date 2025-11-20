/**
 * Migration Runner Script (JavaScript version)
 * Executes SQL migration files
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'interview_genai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function runMigration(migrationFile) {
  const migrationPath = path.join(__dirname, '..', 'config', migrationFile);

  console.log(`📋 Running migration: ${migrationFile}`);
  console.log(`   Path: ${migrationPath}`);

  try {
    // Read SQL file
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log(`   SQL length: ${sql.length} characters`);

    // Execute migration
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');

      console.log(`✅ Migration completed successfully: ${migrationFile}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Migration failed: ${migrationFile}`);
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting Pattern Enhancement Migration\n');

  try {
    // Test database connection
    const result = await pool.query('SELECT NOW()');
    console.log(`✅ Database connected: ${result.rows[0].now}\n`);

    // Run migration
    await runMigration('migrations_pattern_enhancement.sql');

    console.log('\n✨ All migrations completed successfully!');

    // Verify tables were created
    console.log('\n🔍 Verifying tables...');

    const tables = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('pattern_detections', 'pattern_transitions', 'pattern_stability_snapshots')
      ORDER BY tablename
    `);

    console.log('   Tables found:');
    tables.rows.forEach(row => {
      console.log(`   ✓ ${row.tablename}`);
    });

    // Verify pattern_detections has new columns
    const columns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'pattern_detections'
      AND column_name IN ('pattern_type', 'probabilities')
      ORDER BY column_name
    `);

    console.log('\n   pattern_detections new columns:');
    columns.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name} (${row.data_type})`);
    });

    await pool.end();
    console.log('\n✅ Migration verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
