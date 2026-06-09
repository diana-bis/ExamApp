import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pg;
// Database URL configuration. Falls back to local connection if DATABASE_URL is not set.
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/exam_app';
const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('ssl=true') || connectionString.includes('render.com') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
});
// Verify connection on pool initialization
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('🔌 Database connected successfully at:', res.rows[0].now);
    }
});
export default pool;