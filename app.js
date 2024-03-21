import express from 'express'
import { adminRouter } from './routes/adminRoute.js';
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { investorRouter } from './routes/investorRoute.js';
import { customerRouter } from './routes/customerRoute.js';

export const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
    extended: true,
    limit: "50mb"
}));
app.use(cookieParser());

app.use(
    cors({
      origin: "http://localhost:3001",
    //   origin: process.env.WEB_URL,
      methods: "GET,POST,PUT,DELETE",
      credentials: true,
    })
);

app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/investor", investorRouter);
app.use("/api/v1/customer", customerRouter);