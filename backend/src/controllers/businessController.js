import Business from "../models/Business.js";
import BusinessService from "../models/BusinessService.js";

// GET ALL PUBLIC BUSINESSES (with search, category, city, sort, limit)
export const getAllBusinesses = async (req, res) => {
  try {
    const filter = {};

    // By default, show ACTIVE businesses to the public unless status specified
    if (req.query.status) {
      filter.status = req.query.status.toUpperCase();
    } else {
      filter.status = "ACTIVE";
    }

    if (req.query.category && req.query.category.trim()) {
      const rawCat = req.query.category.trim();
      const keywords = rawCat
        .split(/[\s&,/]+/)
        .map((k) => k.trim())
        .filter((k) => k.length > 2);

      if (keywords.length > 0) {
        const pattern = keywords
          .map((k) => {
            if (k.toLowerCase().startsWith("auto")) return "Auto.*";
            return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          })
          .join("|");
        filter.category = new RegExp(pattern, "i");
      } else {
        filter.category = new RegExp(rawCat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      }
    }

    if (req.query.city && req.query.city.trim()) {
      filter.city = new RegExp(req.query.city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    }

    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { city: searchRegex },
        { category: searchRegex }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (req.query.sort === "rating") {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (req.query.sort === "name_asc") {
      sortOption = { name: 1 };
    } else if (req.query.sort === "name_desc") {
      sortOption = { name: -1 };
    }

    let query = Business.find(filter)
      .populate("ownerId", "name email phone")
      .sort(sortOption);

    if (req.query.limit) {
      const limitNum = parseInt(req.query.limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    let businesses = await query.exec();

    // Prioritize Premium and Pro subscribers at the top
    businesses = businesses.sort((a, b) => {
      const tierRank = { PREMIUM: 3, PRO: 2, FREE: 1 };
      const rankA = tierRank[a.subscriptionTier] || 1;
      const rankB = tierRank[b.subscriptionTier] || 1;
      if (rankB !== rankA) {
        return rankB - rankA;
      }
      return 0;
    });

    return res.status(200).json({
      success: true,
      count: businesses.length,
      businesses,
    });
  } catch (error) {
    console.error("Get all public businesses error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

// GET PUBLIC BUSINESS BY ID
export const getPublicBusinessById = async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await Business.findById(businessId).populate(
      "ownerId",
      "name email phone"
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found"
      });
    }

    return res.status(200).json({
      success: true,
      business
    });
  } catch (error) {
    console.error("Get public business by ID error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

// GET PUBLIC SERVICES OF A BUSINESS
export const getPublicBusinessServices = async (req, res) => {
  try {
    const { businessId } = req.params;

    const services = await BusinessService.find({
      businessId,
      isActive: true
    }).sort({ price: 1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    console.error("Get public business services error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

// GET PUBLIC CATEGORIES
export const getPublicCategories = async (req, res) => {
  try {
    const categories = await Business.distinct("category", { status: "ACTIVE" });

    return res.status(200).json({
      success: true,
      categories: categories.sort()
    });
  } catch (error) {
    console.error("Get public categories error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

// CREATE BUSINESS (OWNER)
export const createBusiness = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      address,
      city,
      contactNumber,
      website,
      openingHours
    } = req.body;

    // 1. Validate required fields
    if (
      !name ||
      !category ||
      !address ||
      !city ||
      !contactNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, category, address, city and contact number are required"
      });
    }

    // 2. Check whether this owner already has a business
    const existingBusiness = await Business.findOne({
      ownerId: req.user.userId
    });

    if (existingBusiness) {
      return res.status(409).json({
        success: false,
        message: "You already have a registered business"
      });
    }

    // 3. Create business
    const business = await Business.create({
      ownerId: req.user.userId,
      name,
      description,
      category,
      address,
      city,
      contactNumber,
      website,
      openingHours
    });

    // 4. Send response
    return res.status(201).json({
      success: true,
      message: "Business created successfully",
      business
    });
  } catch (error) {
    console.error("Create business error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// GET BUSINESS BY OWNER (OWNER)
export const getBusinessByOwner = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.userId });
    if (!business) {
      return res.status(404).json({
        success: false,
        message: "No business found for this owner"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Business retrieved successfully",
      business
    });
  } catch (error) {
    console.error("Get business by owner error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// UPDATE MY BUSINESS (OWNER)
export const updateMyBusiness = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "description",
      "category",
      "address",
      "city",
      "contactNumber",
      "website",
      "openingHours"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one valid field to update"
      });
    }

    for (const field of [
      "name",
      "category",
      "address",
      "city",
      "contactNumber"
    ]) {
      if (
        updates[field] !== undefined &&
        (typeof updates[field] !== "string" || !updates[field].trim())
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} cannot be empty`
        });
      }
    }

    for (const field of Object.keys(updates)) {
      if (typeof updates[field] === "string") {
        updates[field] = updates[field].trim();
      }
    }

    const business = await Business.findOneAndUpdate(
      { ownerId: req.user.userId },
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Business updated successfully",
      business
    });
  } catch (error) {
    console.error("Update business error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
