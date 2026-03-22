import { Request, Response } from "express";
import Api from "../models/Api";
import ApiLog from "../models/ApiLog";
import axios from "axios";
import { monitorQueue } from "../queues/monitorQueue";

// @route POST /api/apis
export const createApi = async (req: Request, res: Response) => {
    try {
        const { name, url, method } = req.body;

        if (!name || !url) {
            return res.status(400).json({ message: "Name and URL are required" });
        }

        const api = await Api.create({
            name,
            url,
            method: method || "GET",
            user: req.user!._id,
        });

        res.status(201).json(api);
    } catch (error) {
        console.error("Create API Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @route GET /api/apis/:id/check
export const checkApiStatus = async (req: Request, res: Response) => {
    try {
        const api = await Api.findById(req.params.id);

        if (!api) {
            return res.status(404).json({ message: "API not found" });
        }

        const startTime = Date.now();

        if (api.user.toString() !== req.user!._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        try {
            const response = await axios({
                url: api.url,
                method: api.method as any,
                timeout: 5000,
            });

            const responseTime = Date.now() - startTime;

            api.status = "UP";
            api.responseTime = responseTime;

            await api.save();

            res.json({
                message: "API is UP",
                status: api.status,
                responseTime,
            });
        } catch (error) {
            const responseTime = Date.now() - startTime;

            api.status = "DOWN";
            api.responseTime = responseTime;

            await api.save();

            res.json({
                message: "API is DOWN",
                status: api.status,
                responseTime,
            });
        }
    } catch (error) {
        console.error("Check API Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @route GET /api/apis/:id/logs
export const getApiLogs = async (req: Request, res: Response) => {
    try {
        const apiId = req.params.id;

        const api = await Api.findById(apiId);

        if (!api) {
            return res.status(404).json({ message: "API not found" });
        }

        if (api.user.toString() !== req.user!._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const logs = await ApiLog.find({ api: apiId })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(logs);
    } catch (error) {
        console.error("Get Logs Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @route POST /api/apis/:id/start
export const startMonitoring = async (req: Request, res: Response) => {
    try {
        const api = await Api.findById(req.params.id);

        if (!api) {
            return res.status(404).json({ message: "API not found" });
        }

        if (api.user.toString() !== req.user!._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        if (api.isMonitoring) {
            return res.status(400).json({ message: "Already monitoring" });
        }

        // Add repeatable job
        await monitorQueue.add(
            "monitor-api",
            { apiId: api._id },
            {
                jobId: `monitor-${api._id}`, // unique job
                repeat: {
                    every: 30000, // 30 sec
                },
            }
        );

        api.isMonitoring = true;
        await api.save();

        res.json({ message: "Monitoring started" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @route POST /api/apis/:id/stop
export const stopMonitoring = async (req: Request, res: Response) => {
    try {
        const api = await Api.findById(req.params.id);

        if (!api) {
            return res.status(404).json({ message: "API not found" });
        }

        if (api.user.toString() !== req.user!._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        // Remove job
        await monitorQueue.removeRepeatable(
            "monitor-api",
            {
                every: 30000,
            },
            `monitor-${api._id}`
        );

        api.isMonitoring = false;
        await api.save();

        res.json({ message: "Monitoring stopped" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @route GET /api/apis/:id/uptime?range=24h|7d
export const getApiUptime = async (req: Request, res: Response) => {
    try {
        const apiId = req.params.id;
        const { range } = req.query;

        const api = await Api.findById(apiId);

        if (!api) {
            return res.status(404).json({ message: "API not found" });
        }

        if (api.user.toString() !== req.user!._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        let timeFilter = {};

        if (range === "24h") {
            timeFilter = {
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            };
        } else if (range === "7d") {
            timeFilter = {
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            };
        }

        const totalChecks = await ApiLog.countDocuments({
            api: apiId,
            ...timeFilter,
        });

        if (totalChecks === 0) {
            return res.json({ uptime: 0, range });
        }

        const successChecks = await ApiLog.countDocuments({
            api: apiId,
            status: "UP",
            ...timeFilter,
        });

        const uptime = (successChecks / totalChecks) * 100;

        res.json({
            uptime: uptime.toFixed(2),
            totalChecks,
            successChecks,
            range: range || "lifetime",
        });
    } catch (error) {
        console.error("Uptime Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @route GET /api/apis/:id/history
export const getApiHistory = async (req: Request, res: Response) => {
    try {
        const apiId = req.params.id;

        const api = await Api.findById(apiId);

        if (!api) {
            return res.status(404).json({ message: "API not found" });
        }

        if (api.user.toString() !== req.user!._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        // Last 24 hours filter
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const logs = await ApiLog.find({
            api: apiId,
            createdAt: { $gte: last24Hours },
        })
            .sort({ createdAt: 1 }) // oldest → newest (important for graphs)
            .select("status responseTime createdAt"); // only needed fields

        res.json({
            count: logs.length,
            logs,
        });
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @route GET /api/apis/:id/status
export const getApiStatus = async (req: Request, res: Response) => {
    try {
        const apiId = req.params.id;

        const api = await Api.findById(apiId);

        if (!api) {
            return res.status(404).json({ message: "API not found" });
        }

        if (api.user.toString() !== req.user!._id.toString()) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const latestLog = await ApiLog.findOne({ api: apiId })
            .sort({ createdAt: -1 });

        if (!latestLog) {
            return res.json({ status: "UNKNOWN" });
        }

        res.json({
            status: latestLog.status,
            responseTime: latestLog.responseTime,
            lastChecked: latestLog.createdAt,
        });
    } catch (error) {
        console.error("Status Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};