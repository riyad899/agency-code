import express from "express";
import { getDashboardStats } from "../controllers/dashboardController";
import { verifyToken, requireAdmin } from "../middlewares/auth.middleware";

const router = express.Router();

// Dashboard stats route (admin only)
router.get("/", verifyToken, requireAdmin, getDashboardStats);
router.get("/stats", verifyToken, requireAdmin, getDashboardStats);

export default router;
