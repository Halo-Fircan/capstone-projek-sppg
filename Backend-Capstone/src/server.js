import 'dotenv/config';
import server from './server/index.js';

const port = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  const host = process.env.HOST || 'localhost';
  server.listen(port, () => {
    console.log(`🚀 Gateway Server running at http://${host}:${port}`);
  });
}

export default server;