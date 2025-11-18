#!/usr/bin/env node

/**
 * Database Initialization Script
 * Creates all required tables and schema for Interview-GenAI
 */

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'interview_genai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing database schema...');

    // Read init.sql file
    const initSqlPath = path.resolve(__dirname, '../src/config/init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    // Execute the SQL
    await client.query(initSql);

    console.log('✓ Database schema initialized successfully');
    console.log('✓ All tables created (if not already existing)');
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();
