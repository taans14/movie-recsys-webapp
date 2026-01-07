import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const setupCoreMiddlewares = (app) => {
  app.use(helmet());

  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }));

  app.use(morgan('dev'));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};

export default setupCoreMiddlewares;
