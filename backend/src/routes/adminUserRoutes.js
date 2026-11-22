import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
} from "../controllers/adminUserController.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("ADMIN"));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/:id/status", updateUserStatus);
router.delete("/:id", deleteUser);

export default router;
