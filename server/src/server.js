import dotenv from 'dotenv';
import http from 'http';
import createApp from './app.js';
import connectDb from './config/database.js';

dotenv.config();

const startServer = async () => {
  await connectDb();

  const app = createApp();
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }
};

startServer();
