import express from 'express'
import { adminRouter } from './routes/adminRoute.js';
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from "dotenv";
import { investorRouter } from './routes/investorRoute.js';
import { customerRouter } from './routes/customerRoute.js';

export const app = express();

dotenv.config({ path: "./config/config.env" })

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
    extended: true,
    limit: "50mb"
}));
app.use(cookieParser());

app.use(
    cors({
      origin: [process.env.LOCAL_URL, process.env.WEB_URL],
      methods: "GET,POST,PUT,DELETE",
      credentials: true,
    })
);

console.log(`WEB URL: ${process.env.WEB_URL}`);

app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/investor", investorRouter);
app.use("/api/v1/customer", customerRouter);