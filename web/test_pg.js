const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function test() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log('Connected successfully');
        const res = await client.query('SELECT NOW()');
        console.log('Query result:', res.rows[0]);
        
        const userCount = await client.query('SELECT count(*) FROM "SystemAdmin"');
        console.log('SystemAdmin count:', userCount.rows[0].count);
    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await client.end();
    }
}

test();
