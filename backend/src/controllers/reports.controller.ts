import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../lib/db';

// ─── CSV utilities ────────────────────────────────────────────────────────────

function escapeCSV(v: unknown): string {
  const s = v == null ? '' : String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function buildCSV(headers: string[], rows: unknown[][]): string {
  const header = headers.map(escapeCSV).join(',');
  const body = rows.map((r) => r.map(escapeCSV).join(',')).join('\r\n');
  return `${header}\r\n${body}`;
}

function sendCSV(res: Response, filename: string, csv: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── CSV exports ──────────────────────────────────────────────────────────────

/**
 * GET /admin/reports/applications.csv
 * All applications with student info and scholarship title.
 */
export const exportApplicationsCSV = async (req: Request, res: Response) => {
  try {
    const apps = await prisma.application.findMany({
      include: {
        user: { select: { fullname: true, email: true } },
        scholarship: { select: { title: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const headers = [
      'ID', 'First Name', 'Last Name', 'Student Name', 'Student Email',
      'Scholarship', 'Status', 'Submitted At', 'City', 'Address', 'Phone', 'Email',
    ];

    const rows = apps.map((a) => [
      a.id,
      a.Firstname,
      a.Lastname,
      a.user.fullname,
      a.user.email,
      a.scholarship.title,
      a.status,
      a.submittedAt.toISOString(),
      a.City,
      a.Address,
      a.Phone,
      a.Email,
    ]);

    sendCSV(res, `applications-${todayStr()}.csv`, buildCSV(headers, rows));
  } catch (error) {
    console.error('Export applications CSV error:', error);
    res.status(500).json({ message: 'Failed to export applications' });
  }
};

/**
 * GET /admin/reports/scholarships.csv
 * All scholarships with provider info and application count.
 */
export const exportScholarshipsCSV = async (req: Request, res: Response) => {
  try {
    const rows = await prisma.$queryRaw<{
      id: string;
      title: string;
      provider: string;
      providerEmail: string;
      status: string;
      type: string;
      deadline: Date;
      createdAt: Date;
      applications: number;
    }[]>`
      SELECT s.id,
             s.title,
             u.fullname         AS provider,
             u.email            AS "providerEmail",
             s.status::text,
             s.type,
             s.deadline,
             s."createdAt",
             COUNT(a.id)::int   AS applications
      FROM   "Scholarship" s
      JOIN   "User" u ON u.id = s."providerId"
      LEFT   JOIN "Application" a ON a."scholarshipId" = s.id
      GROUP  BY s.id, u.fullname, u.email
      ORDER  BY s."createdAt" DESC
    `;

    const headers = [
      'ID', 'Title', 'Provider', 'Provider Email', 'Status',
      'Type', 'Deadline', 'Created At', 'Applications',
    ];

    const csvRows = rows.map((r) => [
      r.id,
      r.title,
      r.provider,
      r.providerEmail,
      r.status,
      r.type,
      r.deadline instanceof Date ? r.deadline.toISOString().slice(0, 10) : String(r.deadline),
      r.createdAt instanceof Date ? r.createdAt.toISOString().slice(0, 10) : String(r.createdAt),
      r.applications,
    ]);

    sendCSV(res, `scholarships-${todayStr()}.csv`, buildCSV(headers, csvRows));
  } catch (error) {
    console.error('Export scholarships CSV error:', error);
    res.status(500).json({ message: 'Failed to export scholarships' });
  }
};

/**
 * GET /admin/reports/users.csv
 * All registered users with their role and verification status.
 */
export const exportUsersCSV = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, fullname: true, email: true, role: true, isVerified: true },
      orderBy: { email: 'asc' },
    });

    const headers = ['ID', 'Full Name', 'Email', 'Role', 'Verified'];

    const rows = users.map((u) => [
      u.id,
      u.fullname,
      u.email,
      u.role,
      u.isVerified ? 'Yes' : 'No',
    ]);

    sendCSV(res, `users-${todayStr()}.csv`, buildCSV(headers, rows));
  } catch (error) {
    console.error('Export users CSV error:', error);
    res.status(500).json({ message: 'Failed to export users' });
  }
};

// ─── PDF summary ──────────────────────────────────────────────────────────────

/**
 * GET /admin/reports/summary.pdf
 * One-page formatted summary with key stats and top scholarships.
 */
export const exportSummaryPDF = async (req: Request, res: Response) => {
  try {
    // Gather data in parallel
    const [
      totalUsers, studentCount, orgCount,
      totalScholarships, activeScholarships,
      totalApplications, pendingApps, acceptedApps, rejectedApps,
      topScholarships,
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
      prisma.$queryRaw<{ title: string; applications: number; accepted: number }[]>`
        SELECT s.title,
               COUNT(a.id)::int                                                 AS applications,
               SUM(CASE WHEN a.status = 'ACCEPTED' THEN 1 ELSE 0 END)::int    AS accepted
        FROM   "Scholarship" s
        LEFT   JOIN "Application" a ON a."scholarshipId" = s.id
        GROUP  BY s.id, s.title
        ORDER  BY applications DESC
        LIMIT  10
      `,
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="scholarsphere-summary.pdf"');

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    const INDIGO = '#4f46e5';
    const GRAY   = '#6b7280';
    const BLACK  = '#111827';
    const pageW  = doc.page.width - 100; // usable width with margins

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill(INDIGO);
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
       .text('ScholarSphere', 50, 22);
    doc.fillColor('white').fontSize(11).font('Helvetica')
       .text('Administrative Summary Report', 50, 50);
    doc.fillColor(GRAY).fontSize(9)
       .text(`Generated: ${new Date().toUTCString()}`, 50, 50, { align: 'right' });

    doc.moveDown(3);

    // ── Section helper ───────────────────────────────────────────────────────
    const section = (title: string) => {
      doc.moveDown(0.5);
      doc.fillColor(INDIGO).fontSize(13).font('Helvetica-Bold').text(title);
      doc.moveTo(50, doc.y).lineTo(50 + pageW, doc.y).strokeColor(INDIGO).lineWidth(1).stroke();
      doc.moveDown(0.4);
    };

    const statLine = (label: string, value: string | number) => {
      const y = doc.y;
      doc.fillColor(GRAY).fontSize(10).font('Helvetica').text(label, 60, y);
      doc.fillColor(BLACK).fontSize(10).font('Helvetica-Bold').text(String(value), 250, y);
      doc.moveDown(0.3);
    };

    // ── Users ────────────────────────────────────────────────────────────────
    section('Users');
    statLine('Total users', totalUsers);
    statLine('Students', studentCount);
    statLine('Organizations', orgCount);

    // ── Scholarships ─────────────────────────────────────────────────────────
    section('Scholarships');
    statLine('Total scholarships', totalScholarships);
    statLine('Active', activeScholarships);
    statLine('Expired', totalScholarships - activeScholarships);

    // ── Applications ─────────────────────────────────────────────────────────
    section('Applications');
    statLine('Total applications', totalApplications);
    statLine('Pending', pendingApps);
    statLine('Accepted', acceptedApps);
    statLine('Rejected', rejectedApps);
    statLine('Under review / other', totalApplications - pendingApps - acceptedApps - rejectedApps);

    // ── Top Scholarships table ────────────────────────────────────────────────
    section('Top 10 Scholarships by Applications');

    // Table header
    const colX   = [60, 310, 400, 470];
    const colHdr = ['Scholarship Title', 'Applications', 'Accepted', 'Accept Rate'];

    doc.fillColor('white').rect(50, doc.y, pageW, 18).fill(INDIGO);
    const hdrY = doc.y - 18 + 4;
    colHdr.forEach((h, i) =>
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text(h, colX[i], hdrY, { width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 80 }),
    );
    doc.moveDown(0.2);

    topScholarships.forEach((s, idx) => {
      const bg = idx % 2 === 0 ? '#f9fafb' : 'white';
      const rowY = doc.y;
      doc.rect(50, rowY, pageW, 16).fill(bg);
      const rate = s.applications > 0 ? `${Math.round((s.accepted / s.applications) * 100)}%` : '—';
      const rowData = [s.title.slice(0, 42), String(s.applications), String(s.accepted), rate];
      rowData.forEach((cell, i) =>
        doc.fillColor(BLACK).fontSize(8.5).font('Helvetica').text(cell, colX[i], rowY + 3, {
          width: colX[i + 1] ? colX[i + 1] - colX[i] - 4 : 80,
        }),
      );
      doc.moveDown(0.05);
      doc.y = rowY + 16;
    });

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.moveDown(2);
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
       .text('This report is generated automatically and is for internal use only.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Export summary PDF error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate PDF report' });
    }
  }
};
