import { app } from "./app.js";
import dotenv from "dotenv";
import { connectDatabase } from "./config/database.js";

dotenv.config({ path: "./config/config.env" })

connectDatabase();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port: ${process.env.PORT}`);
});