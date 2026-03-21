import { Worker } from "bullmq";
import Api from "../models/Api";
import ApiLog from "../models/ApiLog";
import axios from "axios";

export const monitorWorker = new Worker(
    "monitor-queue",
    async (job) => {
        const { apiId } = job.data;

        const api = await Api.findById(apiId);

        if (!api) return;

        const startTime = Date.now();

        let status = "DOWN";
        let responseTime = 0;

        try {
            await axios({
                url: api.url,
                method: api.method as any,
                timeout: 5000,
            });

            status = "UP";
            responseTime = Date.now() - startTime;
        } catch (error) {
            status = "DOWN";
            responseTime = Date.now() - startTime;
        }

        api.status = status;
        api.responseTime = responseTime;
        await api.save();

        await ApiLog.create({
            api: api._id,
            status,
            responseTime,
        });

        console.log(`Checked API: ${api.name}`);
    },
    {
        connection: {
            host: "127.0.0.1",
            port: 6379,
            maxRetriesPerRequest: null,
        },
    }
);