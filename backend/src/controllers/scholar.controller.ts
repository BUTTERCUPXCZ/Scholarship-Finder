import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import {
  createScholarSchema,
  CreateScholarInput,
} from "../Validators/CreateScholar";
import { ZodError } from "zod";
import { prisma } from "../lib/db";
import { redisClient } from "../config/redisClient";

export const createScholar = async (req: Request, res: Response) => {
  try {
    const providerId = req.userId as string | undefined;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: provider id missing" });
    }

    const parsedBody: CreateScholarInput = createScholarSchema.parse(req.body);
    const {
      title,
      type,
      description,
      location,
      requirements,
      benefits,
      deadline,
    } = parsedBody;

    const deadlineDate = new Date(deadline);

    const scholar = await prisma.scholarship.create({
      data: {
        title,
        type,
        description,
        location,
        requirements,
        benefits,
        deadline: deadlineDate,
        provider: { connect: { id: providerId } },
        status: "ACTIVE",
      },
    });

    // Invalidate Redis caches so lists return fresh data
    try {
      await redisClient.del(`organization_scholarships:${providerId}`);
      const publicKeys = await redisClient.keys("public_scholarships:*");
      if (publicKeys.length > 0) {
        await redisClient.del(publicKeys);
      }
    } catch (cacheError) {
      console.warn(
        "Failed to invalidate Redis cache after scholarship creation:",
        cacheError,
      );
    }

    return res
      .status(201)
      .json({ success: true, message: "Scholarship Created", data: scholar });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return res
        .status(400)
        .json({ message: "Validation error", errors: error.issues });
    }

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return res
        .status(400)
        .json({ message: "Invalid providerId (foreign key failed)" });
    }
    console.error("Error Create Scholar:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateExpiredScholarships = async () => {
  try {
    const now = new Date();

    // Use transaction to avoid prepared statement conflicts
    const result = await prisma.$transaction(
      async (tx) => {
        return await tx.scholarship.updateMany({
          where: {
            AND: [{ deadline: { lt: now } }, { status: "ACTIVE" }],
          },
          data: {
            status: "EXPIRED",
            updatedAt: now,
          },
        });
      },
      {
        maxWait: 5000, // 5 seconds max wait
        timeout: 10000, // 10 seconds timeout
      },
    );

    console.log(`Updated ${result.count} expired scholarships`);
    return result;
  } catch (error) {
    console.error("Error updating expired scholarships:", error);
    throw error;
  }
};

// New endpoint for manually triggering expired scholarship updates
export const updateExpiredScholarshipsEndpoint = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await updateExpiredScholarships();
    return res.status(200).json({
      success: true,
      message: `Updated ${result.count} expired scholarships`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error updating expired scholarships:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getAllScholars = async (req: Request, res: Response) => {
  try {
    // Parse query parameters for pagination and filtering
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string;
    const type = req.query.type as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build where condition efficiently
    const whereCondition: Prisma.ScholarshipWhereInput = {};

    let providerIdFromToken: string | undefined;

    // Only decode token if we need provider-specific filtering
    const needsProviderFiltering = req.query.myScholarships === "true";

    if (needsProviderFiltering) {
      try {
        const token =
          req.cookies?.authToken ||
          (typeof req.headers["authorization"] === "string" &&
          req.headers["authorization"].startsWith("Bearer ")
            ? req.headers["authorization"]!.split(" ")[1]
            : undefined);

        if (token) {
          const secret = process.env.JWT_SECRET;
          if (secret) {
            const decodedUnknown = jwt.verify(token, secret) as unknown;
            if (typeof decodedUnknown === "object" && decodedUnknown !== null) {
              const userId = (decodedUnknown as Record<string, unknown>)[
                "userId"
              ];
              if (typeof userId === "string" || typeof userId === "number") {
                providerIdFromToken = String(userId);
                whereCondition.providerId = providerIdFromToken;
              }
            }
          }
        }
      } catch (err: unknown) {
        console.log(
          "Token decode failed in getAllScholars:",
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    // OPTIMIZATION 2: Add status filter with default to active scholarships
    // This reduces the dataset significantly
    if (status && ["ACTIVE", "EXPIRED"].includes(status)) {
      whereCondition.status = status as "ACTIVE" | "EXPIRED";
    } else {
      // Default to only active scholarships for better performance
      whereCondition.status = "ACTIVE";
    }

    // OPTIMIZATION 3: Optimize type filtering
    if (type) {
      whereCondition.type = {
        equals: type, // Use equals instead of contains for better index usage
        mode: "insensitive",
      };
    }

    // OPTIMIZATION 4: Optimize search with better indexing strategy
    if (search) {
      // Prioritize title search for better performance
      whereCondition.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        // Remove location search if not critical, as it adds query complexity
      ];
    }

    // ✅ Create unique Redis cache key
    const cacheKey = `scholars:${page}:${limit}:${status || "ALL"}:${type || "ALL"}:${search || "NONE"}:${providerIdFromToken || "public"}`;

    // ✅ Try cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log(`⚡ Cache hit for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cached));
    }

    // OPTIMIZATION 5: Use more selective fields and optimize the query
    const [scholars, totalCount] = await Promise.all([
      prisma.scholarship.findMany({
        where: whereCondition,
        select: {
          id: true,
          title: true,
          description: true,
          deadline: true,
          location: true,
          type: true,
          benefits: true,
          requirements: true,
          status: true,
          createdAt: true,
          // Remove updatedAt if not needed to reduce data transfer
          providerId: true,
        },
        orderBy: [
          { status: "asc" }, // Active first
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      // OPTIMIZATION 6: Consider caching total count for popular queries
      prisma.scholarship.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const responseData = {
      success: true,
      data: scholars,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    // ✅ Save to Redis (10 minutes)
    await redisClient.setEx(cacheKey, 600, JSON.stringify(responseData));

    console.log(`Cached response for ${cacheKey}`);
    return res.status(200).json(responseData);
  } catch (error: unknown) {
    console.error("Error fetching scholarships:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getScholarshipById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Scholarship ID is required" });
    }

    // ✅ Build Redis cache key
    const cacheKey = `scholarship:${id}`;

    // ✅ Check Redis first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("Cache hit ✅", cacheKey);
      return res.status(200).json(JSON.parse(cached as string));
    }

    // First, update any expired scholarships
    await updateExpiredScholarships();

    // Then fetch the specific scholarship
    const scholarship = await prisma.scholarship.findUnique({
      where: { id },
    });

    if (!scholarship) {
      return res
        .status(404)
        .json({ success: false, message: "Scholarship not found" });
    }
    const responseData = { success: true, data: scholarship };

    // ✅ Store in Redis with TTL (e.g. 5 minutes = 300 seconds)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching scholarship:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const updateScholar = async (req: Request, res: Response) => {
  try {
    const providerId = req.userId as string | undefined;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: provider id missing" });
    }

    const { id } = req.params;
    const scholarshipId = id;

    if (!scholarshipId) {
      return res
        .status(400)
        .json({ success: false, message: "Scholarship id is required" });
    }

    const {
      title,
      type,
      description,
      location,
      requirements,
      benefits,
      deadline,
    } = req.body;

    // Check if scholarship exists
    const existingScholarship = await prisma.scholarship.findUnique({
      where: { id: scholarshipId },
    });

    if (!existingScholarship) {
      return res
        .status(404)
        .json({ success: false, message: "Scholarship not found" });
    }

    if (existingScholarship.providerId !== providerId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only update your own scholarships",
      });
    }

    const deadlineDate = new Date(deadline);

    // 📝 Update the scholarship
    const updatedScholarship = await prisma.scholarship.update({
      where: { id: scholarshipId },
      data: {
        title,
        type,
        description,
        location,
        requirements,
        benefits,
        deadline: deadlineDate,
      },
    });

    // 🧹 Invalidate related Redis caches
    const cacheKeysToDelete = [
      `scholarship:${id}`, // single scholarship cache
      `organization:scholarships:${providerId}`, // organization cache
    ];

    try {
      // Clear all public cached lists
      const publicKeys = await redisClient.keys("public:scholars:*");
      if (publicKeys.length > 0) cacheKeysToDelete.push(...publicKeys);

      // Delete all related cache keys
      if (cacheKeysToDelete.length > 0) {
        await Promise.all(cacheKeysToDelete.map((key) => redisClient.del(key)));
        console.log("Redis cache invalidated for:", cacheKeysToDelete);
      }
    } catch (err) {
      console.warn("Redis cache invalidation warning:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Scholarship updated successfully",
      data: updatedScholarship,
    });
  } catch (error) {
    console.error("Error updating scholarship:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const deleteScholarship = async (req: Request, res: Response) => {
  try {
    const providerId = req.userId as string | undefined;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: provider id missing" });
    }

    const { id } = req.params;
    const scholarshipId = id;
    if (!scholarshipId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid scholarship id" });
    }

    const scholarship = await prisma.scholarship.findUnique({
      where: { id: scholarshipId },
    });

    if (!scholarship) {
      return res
        .status(404)
        .json({ success: false, message: "Scholarship not found" });
    }

    if (scholarship.providerId !== providerId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only delete your own scholarships",
      });
    }

    // 🗑 Delete from DB
    await prisma.scholarship.delete({ where: { id: scholarshipId } });

    // 🧹 Invalidate related Redis cache keys
    const cacheKeysToDelete = [
      `scholarship:${id}`, // single scholarship cache
      `organization_scholarships:${providerId}`, // org's scholarships list
    ];

    try {
      // Clear cached public lists
      const publicKeys = await redisClient.keys("public_scholarships:*");
      if (publicKeys.length > 0) cacheKeysToDelete.push(...publicKeys);

      // Delete all affected keys
      if (cacheKeysToDelete.length > 0) {
        await Promise.all(cacheKeysToDelete.map((key) => redisClient.del(key)));
        console.log("Redis cache invalidated for:", cacheKeysToDelete);
      }
    } catch (err) {
      console.warn("Redis cache invalidation error:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Scholarship deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scholarship:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const ArchiveScholarship = async (req: Request, res: Response) => {
  try {
    const providerId = req.userId as string | undefined;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: provider id missing" });
    }

    const { id } = req.params;
    const scholarshipId = id;

    if (!scholarshipId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid scholarship id" });
    }

    // Check scholarship existence
    const scholarship = await prisma.scholarship.findUnique({
      where: { id: scholarshipId },
    });

    if (!scholarship) {
      return res
        .status(404)
        .json({ success: false, message: "Scholarship not found" });
    }

    if (scholarship.providerId !== providerId) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only archive your own scholarships",
      });
    }

    // Create archive record
    const archivedScholarship = await prisma.archive.create({
      data: {
        scholarshipId: scholarship.id,
        title: scholarship.title,
        description: scholarship.description,
        providerId: scholarship.providerId,
        deadline: scholarship.deadline,
        location: scholarship.location,
        type: scholarship.type,
        benefits: scholarship.benefits,
        requirements: scholarship.requirements,
        originalStatus: scholarship.status,
        archivedBy: providerId,
        originalCreatedAt: scholarship.createdAt,
        originalUpdatedAt: scholarship.updatedAt,
      },
    });

    // Mark original scholarship as archived
    await prisma.scholarship.update({
      where: { id },
      data: { status: "EXPIRED" },
    });

    return res.status(200).json({
      success: true,
      message: "Scholarship archived successfully",
      data: archivedScholarship,
    });
  } catch (error) {
    console.error("Error archiving scholarship:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getOrganizationScholarships = async (
  req: Request,
  res: Response,
) => {
  try {
    const providerId = req.userId as string | undefined;

    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: provider id missing" });
    }

    // ✅ Create a unique cache key per provider
    const cacheKey = `organization_scholarships:${providerId}`;

    // ✅ Check Redis first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("Cache hit ✅", cacheKey);
      return res.status(200).json(JSON.parse(cached as string));
    }

    const scholarships = await prisma.scholarship.findMany({
      where: {
        providerId: providerId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        applications: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    const responseData = {
      success: true,
      data: scholarships,
    };

    // ✅ Cache for 5 minutes (300 seconds)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));
    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching organization scholarships:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getArchivedScholarships = async (req: Request, res: Response) => {
  try {
    const providerId = req.userId as string | undefined;

    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: provider id missing" });
    }

    const archivedScholarships = await prisma.archive.findMany({
      where: { providerId: providerId },
      orderBy: { archivedAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: archivedScholarships,
    });
  } catch (error) {
    console.error("Error fetching archived scholarships:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Public endpoint for students to browse scholarships
export const getPublicScholars = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const type = req.query.type as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const whereCondition: Prisma.ScholarshipWhereInput = {
      status: "ACTIVE", // only active scholarships for students by default
    };

    if (type) {
      whereCondition.type = {
        contains: type,
        mode: "insensitive",
      };
    }

    if (search) {
      whereCondition.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // ✅ Build a cache key
    const cacheKey = `public_scholarships:page=${page}:limit=${limit}:type=${type || ""}:search=${search || ""}`;

    // ✅ Check Redis cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("Cache hit ✅", cacheKey);
      return res.status(200).json(JSON.parse(cached as string));
    }

    const [scholars, totalCount] = await Promise.all([
      prisma.scholarship.findMany({
        where: whereCondition,
        select: {
          id: true,
          title: true,
          description: true,
          deadline: true,
          location: true,
          type: true,
          benefits: true,
          requirements: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          providerId: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.scholarship.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const responseData = {
      success: true,
      data: scholars,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    await redisClient.setEx(cacheKey, 600, JSON.stringify(responseData));

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching public scholarships:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const DeleteArchivedScholarship = async (
  req: Request,
  res: Response,
) => {
  try {
    const providerId = (req.userId as string) || undefined;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: provider id missing" });
    }

    const { id } = req.params;
    const archiveId = id;
    if (!archiveId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid archive id" });
    }

    const response = await prisma.archive.deleteMany({
      where: {
        id: archiveId,
        providerId: providerId,
      },
    });
    if (response.count === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Archive record not found or you don't have permission to delete it",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Archived scholarship record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting archived scholarship:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
export const RestoreArchivedScholarship = async (
  req: Request,
  res: Response,
) => {
  try {
    const providerId = req.userId as string | undefined;
    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: provider id missing" });
    }
    const { id } = req.params;
    const archiveId = id;
    if (!archiveId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid archive id" });
    }
    const archiveRecord = await prisma.archive.findUnique({
      where: { id: archiveId },
    });
    if (!archiveRecord) {
      return res
        .status(404)
        .json({ success: false, message: "Archive record not found" });
    }
    if (archiveRecord.providerId !== providerId) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You can only restore your own archived scholarships",
      });
    }
    const restoredScholarship = await prisma.scholarship.create({
      data: {
        title: archiveRecord.title,
        description: archiveRecord.description,
        location: archiveRecord.location,
        benefits: archiveRecord.benefits,
        requirements: archiveRecord.requirements,
        deadline: archiveRecord.deadline,
        type: archiveRecord.type,
        status: archiveRecord.originalStatus,
        providerId: archiveRecord.providerId,
      },
    });
    await prisma.archive.delete({
      where: { id: archiveId },
    });
    return res.status(200).json({
      success: true,
      message: "Archived scholarship restored successfully",
      data: restoredScholarship,
    });
  } catch (error) {
    console.error("Error restoring archived scholarship:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
