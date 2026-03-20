import express from "express";
import { createApi } from "../controllers/apiController";
import { protect } from "../middlewares/authMiddleware";
import { checkApiStatus } from "../controllers/apiController";

const router = express.Router();

router.post("/", protect, createApi);
router.get("/:id/check", protect, checkApiStatus);

export default router;