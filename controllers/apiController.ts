import { Request, Response } from "express";
import Api from "../models/Api";
import axios from "axios";

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