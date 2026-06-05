import pg from 'pg';

const { Pool } = pg;

const poolConfig = process.env.POSTGRES_URL
  ? {
    connectionString: process.env.POSTGRES_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  }
  : {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
  };

const pool = new Pool(poolConfig);

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Gagal mengoneksikan ke database PostgreSQL:', err.stack);
  }
  console.log('⚡ Sukses terkoneksi ke database PostgreSQL lokal!');
  release();
});

export default pool;