
import Business from "../models/Business.js";

const businessMiddleware = async (req, res, next) => {
  try {
    const business = await Business.findOne({
      ownerId: req.user.userId,
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found.",
      });
    }

    // Attach the business to the request.
    req.business = business;

    next();

  } catch (error) {
    console.error("Business middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export default businessMiddleware;
