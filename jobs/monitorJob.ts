import { monitorQueue } from "../queues/monitorQueue";

export const startMonitoring = async () => {
    await monitorQueue.add(
        "check-apis",
        {},
        {
            repeat: {
                every: 30000, // every 30 seconds
            },
        }
    );

    console.log(" Monitoring job scheduled with BullMQ ");
};