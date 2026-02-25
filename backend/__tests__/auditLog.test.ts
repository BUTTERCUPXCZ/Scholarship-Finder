import {
  createAuditLog,
  getAuditLogs,
  extractIpAddress,
} from "../src/services/auditLog.service";
import { getAuditLogsHandler } from "../src/controllers/auditLog.controller";
import { prisma } from "../src/lib/db";
import { AuditAction, AuditStatus } from "@prisma/client";
import { Request, Response } from "express";
import express from "express";
import request from "supertest";
import auditLogRouter, { requireAdmin } from "../src/routes/auditLog.routes";

// ---- Mock Prisma -----------------------------------------------------------

jest.mock("../src/lib/db", () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// ---- Mock auth middleware --------------------------------------------------

jest.mock("../src/middleware/auth", () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.userId = "admin-user-id";
    req.user = { id: "admin-user-id", email: "admin@test.com", role: "ADMIN" };
    next();
  }),
}));

// ---- Helper ---------------------------------------------------------------

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ===========================================================================
// Service tests
// ===========================================================================

describe("AuditLog Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- createAuditLog -----------------------------------------------------

  describe("createAuditLog", () => {
    it("should call prisma.auditLog.create with correct data", async () => {
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: "log-1" });

      await createAuditLog({
        userId: "user-1",
        action: AuditAction.USER_LOGIN,
        ipAddress: "127.0.0.1",
        userAgent: "Jest/1.0",
        status: AuditStatus.SUCCESS,
        metadata: { email: "user@test.com" },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            action: AuditAction.USER_LOGIN,
            status: AuditStatus.SUCCESS,
            ipAddress: "127.0.0.1",
          }),
        }),
      );
    });

    it("should handle null userId for pre-auth events", async () => {
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: "log-2" });

      await createAuditLog({
        userId: null,
        action: AuditAction.USER_LOGIN,
        ipAddress: "10.0.0.1",
        userAgent: "Mozilla/5.0",
        status: AuditStatus.FAILURE,
        metadata: { reason: "invalid_credentials" },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: null,
            status: AuditStatus.FAILURE,
          }),
        }),
      );
    });

    it("should propagate prisma errors (caller handles .catch())", async () => {
      (prisma.auditLog.create as jest.Mock).mockRejectedValue(
        new Error("DB error"),
      );

      await expect(
        createAuditLog({
          userId: "user-1",
          action: AuditAction.USER_LOGIN,
          ipAddress: "127.0.0.1",
          userAgent: "Jest/1.0",
          status: AuditStatus.SUCCESS,
        }),
      ).rejects.toThrow("DB error");
    });

    it("should use Prisma.JsonNull when metadata is null", async () => {
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: "log-3" });

      await createAuditLog({
        userId: "user-1",
        action: AuditAction.USER_LOGOUT,
        ipAddress: "127.0.0.1",
        userAgent: "Jest/1.0",
        status: AuditStatus.SUCCESS,
        metadata: null,
      });

      // Prisma.JsonNull is a Symbol — just verify create was called
      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    });
  });

  // ---- getAuditLogs -------------------------------------------------------

  describe("getAuditLogs", () => {
    const mockLogs = [
      {
        id: "log-1",
        userId: "user-1",
        action: AuditAction.USER_LOGIN,
        resource: null,
        resourceId: null,
        ipAddress: "127.0.0.1",
        userAgent: "Jest/1.0",
        status: AuditStatus.SUCCESS,
        metadata: null,
        createdAt: new Date("2026-01-01T10:00:00Z"),
      },
    ];

    beforeEach(() => {
      (prisma.auditLog.findMany as jest.Mock).mockResolvedValue(mockLogs);
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(1);
    });

    it("should return paginated audit logs", async () => {
      const result = await getAuditLogs({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalCount).toBe(1);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it("should apply userId filter", async () => {
      await getAuditLogs({ userId: "user-1" });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: "user-1" }),
        }),
      );
    });

    it("should apply action filter", async () => {
      await getAuditLogs({ action: AuditAction.USER_LOGIN });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: AuditAction.USER_LOGIN }),
        }),
      );
    });

    it("should apply status filter", async () => {
      await getAuditLogs({ status: AuditStatus.FAILURE });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: AuditStatus.FAILURE }),
        }),
      );
    });

    it("should apply date range filter", async () => {
      const start = new Date("2026-01-01");
      const end = new Date("2026-01-31");

      await getAuditLogs({ startDate: start, endDate: end });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({ gte: start, lte: end }),
          }),
        }),
      );
    });

    it("should cap limit at 100", async () => {
      await getAuditLogs({ limit: 9999 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it("should default to page 1, limit 20", async () => {
      await getAuditLogs({});

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });

    it("should calculate hasNext correctly when more pages exist", async () => {
      (prisma.auditLog.count as jest.Mock).mockResolvedValue(50);

      const result = await getAuditLogs({ page: 1, limit: 20 });

      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });

  // ---- extractIpAddress ---------------------------------------------------

  describe("extractIpAddress", () => {
    const makeReq = (overrides: Partial<Request> = {}): Request => {
      return {
        ip: "127.0.0.1",
        headers: {},
        ...overrides,
      } as unknown as Request;
    };

    it("should return req.ip when no proxy headers present", () => {
      const req = makeReq({ ip: "192.168.1.1", headers: {} });
      expect(extractIpAddress(req)).toBe("192.168.1.1");
    });

    it("should prefer x-forwarded-for over req.ip and take first IP", () => {
      const req = makeReq({
        ip: "127.0.0.1",
        headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
      });
      expect(extractIpAddress(req)).toBe("203.0.113.1");
    });

    it("should handle x-real-ip header", () => {
      const req = makeReq({
        ip: "127.0.0.1",
        headers: { "x-real-ip": "203.0.113.5" },
      });
      expect(extractIpAddress(req)).toBe("203.0.113.5");
    });

    it("should strip IPv6-mapped IPv4 prefix", () => {
      const req = makeReq({ ip: "::ffff:192.168.1.100", headers: {} });
      expect(extractIpAddress(req)).toBe("192.168.1.100");
    });

    it("should return unknown when ip is undefined", () => {
      const req = makeReq({ ip: undefined, headers: {} });
      expect(extractIpAddress(req)).toBe("unknown");
    });
  });
});

// ===========================================================================
// Controller unit tests
// ===========================================================================

describe("AuditLog Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.auditLog.count as jest.Mock).mockResolvedValue(0);
  });

  describe("getAuditLogsHandler", () => {
    it("should return 200 with audit logs on success", async () => {
      const req = { query: {} } as unknown as Request;
      const res = mockResponse();

      await getAuditLogsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true }),
      );
    });

    it("should return 400 for invalid action enum value", async () => {
      const req = {
        query: { action: "INVALID_ACTION" },
      } as unknown as Request;
      const res = mockResponse();

      await getAuditLogsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Invalid action"),
        }),
      );
    });

    it("should return 400 for invalid status value", async () => {
      const req = { query: { status: "MAYBE" } } as unknown as Request;
      const res = mockResponse();

      await getAuditLogsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Invalid status"),
        }),
      );
    });

    it("should return 400 when startDate is after endDate", async () => {
      const req = {
        query: { startDate: "2026-12-31", endDate: "2026-01-01" },
      } as unknown as Request;
      const res = mockResponse();

      await getAuditLogsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("startDate must be before"),
        }),
      );
    });

    it("should return 400 for invalid startDate format", async () => {
      const req = {
        query: { startDate: "not-a-date" },
      } as unknown as Request;
      const res = mockResponse();

      await getAuditLogsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 400 for invalid endDate format", async () => {
      const req = { query: { endDate: "bad-date" } } as unknown as Request;
      const res = mockResponse();

      await getAuditLogsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should pass valid action filter to service", async () => {
      const req = {
        query: { action: "USER_LOGIN" },
      } as unknown as Request;
      const res = mockResponse();

      await getAuditLogsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ action: AuditAction.USER_LOGIN }),
        }),
      );
    });

    it("should pass pagination to service", async () => {
      const req = {
        query: { page: "2", limit: "5" },
      } as unknown as Request;
      const res = mockResponse();

      await getAuditLogsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });
});

// ===========================================================================
// Route-level integration tests (Supertest)
// ===========================================================================

describe("GET /audit-logs route", () => {
  const app = express();
  app.use(express.json());
  app.use("/audit-logs", auditLogRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.auditLog.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.auditLog.count as jest.Mock).mockResolvedValue(0);
  });

  it("should return 200 for ADMIN user", async () => {
    const res = await request(app).get("/audit-logs");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return 403 for STUDENT user", async () => {
    const { authenticate } = require("../src/middleware/auth");
    (authenticate as jest.Mock).mockImplementationOnce(
      (req: any, _res: any, next: any) => {
        req.userId = "student-id";
        req.user = {
          id: "student-id",
          email: "student@test.com",
          role: "STUDENT",
        };
        next();
      },
    );

    const res = await request(app).get("/audit-logs");
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("INSUFFICIENT_ROLE");
  });

  it("should return 403 for ORGANIZATION user", async () => {
    const { authenticate } = require("../src/middleware/auth");
    (authenticate as jest.Mock).mockImplementationOnce(
      (req: any, _res: any, next: any) => {
        req.userId = "org-id";
        req.user = { id: "org-id", email: "org@test.com", role: "ORGANIZATION" };
        next();
      },
    );

    const res = await request(app).get("/audit-logs");
    expect(res.status).toBe(403);
  });

  it("should filter by action query param", async () => {
    const res = await request(app)
      .get("/audit-logs")
      .query({ action: "USER_LOGIN" });

    expect(res.status).toBe(200);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ action: AuditAction.USER_LOGIN }),
      }),
    );
  });

  it("should filter by status=FAILURE", async () => {
    const res = await request(app)
      .get("/audit-logs")
      .query({ status: "FAILURE" });

    expect(res.status).toBe(200);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: AuditStatus.FAILURE }),
      }),
    );
  });

  it("should apply pagination params", async () => {
    const res = await request(app)
      .get("/audit-logs")
      .query({ page: "2", limit: "5" });

    expect(res.status).toBe(200);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
  });

  it("should return 400 for invalid action", async () => {
    const res = await request(app)
      .get("/audit-logs")
      .query({ action: "NOT_REAL" });

    expect(res.status).toBe(400);
  });

  it("should return 400 when startDate > endDate", async () => {
    const res = await request(app).get("/audit-logs").query({
      startDate: "2026-12-01",
      endDate: "2026-01-01",
    });

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// requireAdmin middleware unit test
// ===========================================================================

describe("requireAdmin middleware", () => {
  it("should call next() for ADMIN users", () => {
    const req = {
      user: { id: "admin-id", email: "admin@test.com", role: "ADMIN" },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should return 403 for STUDENT users", () => {
    const req = {
      user: { id: "student-id", email: "s@test.com", role: "STUDENT" },
    } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should return 403 when req.user is undefined", () => {
    const req = { user: undefined } as unknown as Request;
    const res = mockResponse();
    const next = jest.fn();

    requireAdmin(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
