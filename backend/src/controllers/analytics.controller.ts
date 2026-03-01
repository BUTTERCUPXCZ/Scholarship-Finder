import { Request, Response } from 'express';
import { prisma } from '../lib/db';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Valid period values (days) accepted by time-series endpoints. */
const VALID_PERIODS = [7, 30, 90] as const;
type Period = (typeof VALID_PERIODS)[number];

function parsePeriod(raw: unknown): Period {
  const n = Number(raw);
  return (VALID_PERIODS as readonly number[]).includes(n) ? (n as Period) : 30;
}

/**
 * Fill in zero-count days so the chart always has a continuous x-axis.
 * `rows` come from a GROUP BY DATE_TRUNC query — days with no data are absent.
 */
function fillDays(
  rows: { date: Date; count: number }[],
  period: number,
): { date: string; count: number }[] {
  const map = new Map(rows.map((r) => [r.date.toISOString().slice(0, 10), r.count]));
  const result: { date: string; count: number }[] = [];
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) ?? 0 });
  }
  return result;
}

// ─── controllers ─────────────────────────────────────────────────────────────

/**
 * GET /admin/analytics/applications-over-time?period=30
 * Daily application submission counts for the last N days.
 */
export const getApplicationsOverTime = async (req: Request, res: Response) => {
  try {
    const period = parsePeriod(req.query.period);

    const rows = await prisma.$queryRaw<{ date: Date; count: number }[]>`
      SELECT DATE_TRUNC('day', "submittedAt") AS date,
             COUNT(*)::int                    AS count
      FROM   "Application"
      WHERE  "submittedAt" >= NOW() - (${period}::int || ' days')::INTERVAL
      GROUP  BY date
      ORDER  BY date ASC
    `;

    return res.status(200).json({ success: true, data: fillDays(rows, period) });
  } catch (error) {
    console.error('Analytics applications-over-time error:', error);
    return res.status(500).json({ message: 'Failed to fetch application trends' });
  }
};

/**
 * GET /admin/analytics/scholarship-performance
 * Top 10 scholarships by total applications, with accepted/rejected/under-review counts.
 */
export const getScholarshipPerformance = async (req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRaw<{
      id: string;
      title: string;
      status: string;
      applications: number;
      accepted: number;
      rejected: number;
      underReview: number;
    }[]>`
      SELECT s.id,
             s.title,
             s.status::text,
             COUNT(a.id)::int                                                   AS applications,
             SUM(CASE WHEN a.status = 'ACCEPTED'     THEN 1 ELSE 0 END)::int  AS accepted,
             SUM(CASE WHEN a.status = 'REJECTED'     THEN 1 ELSE 0 END)::int  AS rejected,
             SUM(CASE WHEN a.status = 'UNDER_REVIEW' THEN 1 ELSE 0 END)::int  AS "underReview"
      FROM   "Scholarship" s
      LEFT   JOIN "Application" a ON a."scholarshipId" = s.id
      GROUP  BY s.id, s.title, s.status
      ORDER  BY applications DESC
      LIMIT  10
    `;

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Analytics scholarship-performance error:', error);
    return res.status(500).json({ message: 'Failed to fetch scholarship performance' });
  }
};

/**
 * GET /admin/analytics/user-registrations?period=30
 * Daily user registration counts derived from AuditLog (User has no createdAt).
 */
export const getUserRegistrationsOverTime = async (req: Request, res: Response) => {
  try {
    const period = parsePeriod(req.query.period);

    const rows = await prisma.$queryRaw<{ date: Date; count: number }[]>`
      SELECT DATE_TRUNC('day', "createdAt") AS date,
             COUNT(*)::int                  AS count
      FROM   "AuditLog"
      WHERE  action     = 'USER_REGISTER'
        AND  status     = 'SUCCESS'
        AND  "createdAt" >= NOW() - (${period}::int || ' days')::INTERVAL
      GROUP  BY date
      ORDER  BY date ASC
    `;

    return res.status(200).json({ success: true, data: fillDays(rows, period) });
  } catch (error) {
    console.error('Analytics user-registrations error:', error);
    return res.status(500).json({ message: 'Failed to fetch user registration trends' });
  }
};

/**
 * GET /admin/analytics/application-funnel
 * Count of applications grouped by status for a funnel / donut chart.
 */
export const getApplicationFunnel = async (req: Request, res: Response) => {
  try {
    const groups = await prisma.application.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const data = groups.map((g) => ({ status: g.status, count: g._count.id }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Analytics application-funnel error:', error);
    return res.status(500).json({ message: 'Failed to fetch application funnel' });
  }
};
