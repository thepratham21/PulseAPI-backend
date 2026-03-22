import express from "express";
import { createApi } from "../controllers/apiController";
import { protect } from "../middlewares/authMiddleware";
import { checkApiStatus } from "../controllers/apiController";
import { getApiLogs } from "../controllers/apiController";
import { startMonitoring, stopMonitoring } from "../controllers/apiController";
import { getApiUptime } from "../controllers/apiController";
import { getApiHistory } from "../controllers/apiController";
import { getApiStatus } from "../controllers/apiController";

const router = express.Router();

router.post("/", protect, createApi);
router.get("/:id/check", protect, checkApiStatus);
router.get("/:id/logs", protect, getApiLogs);
router.post("/:id/start", protect, startMonitoring);
router.post("/:id/stop", protect, stopMonitoring);
router.get("/:id/uptime", protect, getApiUptime);
router.get("/:id/history", protect, getApiHistory);
router.get("/:id/status", protect, getApiStatus);

export default router;