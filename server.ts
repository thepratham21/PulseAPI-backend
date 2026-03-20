import app from "./app";
import dotenv from "dotenv";
import connectDB from "./config/db";

import "./workers/monitorWorker";
import { startMonitoring } from "./jobs/monitorJob";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {

        await connectDB();

        await startMonitoring();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
};

startServer();