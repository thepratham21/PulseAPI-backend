import { Worker } from "bullmq";
import Api from "../models/Api";
import axios from "axios";

export const monitorWorker = new Worker(
    "monitor-queue",
    async (job) => {
        console.log("Processing API monitoring job");

        const apis = await Api.find();

        for (const api of apis) {
            const startTime = Date.now();

            try {
                await axios({
                    url: api.url,
                    method: api.method as any,
                    timeout: 5000,
                });

                api.status = "UP";
                api.responseTime = Date.now() - startTime;
            } catch (error) {
                api.status = "DOWN";
                api.responseTime = Date.now() - startTime;
            }

            await api.save();
        }

        return { success: true };
    },

    {
        connection: {
            host: "127.0.0.1",
            port: 6379,
            maxRetriesPerRequest: null,
        },
    }
);