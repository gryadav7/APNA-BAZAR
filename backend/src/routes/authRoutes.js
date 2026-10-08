import express from "express"
import { register ,login , getMe, logout } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
const router = express.Router();


router.get(
    "/admin-test",
    authMiddleware,
    roleMiddleware("ADMIN"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Welcome Admin"
        });
    }
);
router.post("/logout", authMiddleware, logout);
router.post("/register",register);

router.post("/login",login);

router.get("/me", authMiddleware, getMe);
export default router;
