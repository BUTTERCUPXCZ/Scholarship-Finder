import { Request, Response } from 'express';
import { prisma } from '../lib/db';

/**
 * GET /admin/stats
 * System-wide aggregate statistics for the admin dashboard.
 */
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      studentCount,
      orgCount,
      totalScholarships,
      activeScholarships,
      totalApplications,
      pendingApps,
      acceptedApps,
      rejectedApps,
      auditEvents24h,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'ORGANIZATION' } }),
      prisma.scholarship.count(),
      prisma.scholarship.count({ where: { status: 'ACTIVE' } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: 'PENDING' } }),
      prisma.application.count({ where: { status: 'ACCEPTED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.auditLog.count({
        where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          students: studentCount,
          organizations: orgCount,
        },
        scholarships: {
          total: totalScholarships,
          active: activeScholarships,
        },
        applications: {
          total: totalApplications,
          pending: pendingApps,
          accepted: acceptedApps,
          rejected: rejectedApps,
        },
        auditEvents24h,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
};

/**
 * GET /admin/users
 * Paginated list of all users with optional role filter and name/email search.
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { role, search } = req.query as { role?: string; search?: string };

    const where: Record<string, unknown> = {};
    if (role && ['STUDENT', 'ORGANIZATION', 'ADMIN'].includes(role)) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { fullname: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, fullname: true, email: true, role: true },
        orderBy: { email: 'asc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Admin getAllUsers error:', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};
