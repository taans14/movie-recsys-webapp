import express from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import setupCoreMiddlewares from './middlewares/core.middleware.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';
import configurePassport from './config/passport.js';

import routesV1 from './routes/v1.js';

const createApp = () => {
  const app = express();

  setupCoreMiddlewares(app);

  app.use(cookieParser());
  app.use(passport.initialize());

  configurePassport(passport);

  app.use('/api/v1', apiLimiter, routesV1);

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
  });

  return app;
};

export default createApp;
