import { Worker } from "bullmq";
import Api from "../models/Api";
import axios from "axios";
import ApiLog from "../models/ApiLog";

export const monitorWorker = new Worker(
    "monitor-queue",
    async (job) => {
        console.log("Processing API monitoring job");

        const apis = await Api.find();

        for (const api of apis) {
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