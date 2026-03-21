import express from "express";
import { createApi } from "../controllers/apiController";
import { protect } from "../middlewares/authMiddleware";
import { checkApiStatus } from "../controllers/apiController";
import { getApiLogs } from "../controllers/apiController";
import { startMonitoring, stopMonitoring } from "../controllers/apiController";

const router = express.Router();

router.post("/", protect, createApi);
router.get("/:id/check", protect, checkApiStatus);
router.get("/:id/logs", protect, getApiLogs);
router.post("/:id/start", protect, startMonitoring);
router.post("/:id/stop", protect, stopMonitoring);

export default router;