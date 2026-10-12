import express from "express";
import {createBusiness,getBusinessByOwner, updateMyBusiness,} from "../controllers/businessController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";


const router = express.Router();



router.post("/",authMiddleware, roleMiddleware("BUSINESS_OWNER"), createBusiness);
router.get("/my-business",authMiddleware,roleMiddleware("BUSINESS_OWNER"),getBusinessByOwner);
router.put(
  "/my-business",
  authMiddleware,
  roleMiddleware("BUSINESS_OWNER"),
  updateMyBusiness
);

export default router;
