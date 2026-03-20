import { Queue } from "bullmq";

export const monitorQueue = new Queue("monitor-queue", {
    connection: {
        host: "127.0.0.1",
        port: 6379,
        maxRetriesPerRequest: null,
    },
});