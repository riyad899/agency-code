import express from "express";
import {
    createOrder,
    getAllOrders,
    getOrderById,
    getOrderByOrderNumber,
    getUserOrders,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    updateOrder,
    deleteOrder,
    getOrderStats,
    trackOrdersByEmail
} from "./order.controller";
import { verifyToken, requireAdmin } from "../../middlewares/auth.middleware";

const router = express.Router();

// Public routes
router.post("/",verifyToken, createOrder); // Create order (customers can place orders)
router.get("/track/:email", trackOrdersByEmail); // Track orders by email (public)

// Authenticated user routes (must come before :id routes)
router.get("/my-orders", verifyToken, getUserOrders);
router.get("/:id/status", verifyToken, getOrderById); // Users can view their order status
router.patch("/:id/cancel", verifyToken, cancelOrder);

// Admin-only routes
router.get("/", verifyToken, requireAdmin, getAllOrders);
router.get("/stats", verifyToken, requireAdmin, getOrderStats);
router.get("/number/:orderNumber", verifyToken, getOrderByOrderNumber);
router.get("/:id", verifyToken, getOrderById);
router.patch("/:id/status", verifyToken, requireAdmin, updateOrderStatus);
router.patch("/:id/payment", verifyToken, requireAdmin, updatePaymentStatus);
router.put("/:id", verifyToken, requireAdmin, updateOrder);
router.delete("/:id", verifyToken, requireAdmin, deleteOrder);

export default router;
