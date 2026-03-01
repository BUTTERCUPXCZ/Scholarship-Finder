import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../AuthProvider/AuthProvider'
import { SidebarProvider, SidebarInset } from '../components/ui/sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import AdminSidebar from '../components/adminSidebar'
import Navbar from '../components/Navbar'
import { downloadReport } from '../services/admin'
import { FileText, Users, GraduationCap, FileDown, Loader2 } from 'lucide-react'

// ─── report definitions ───────────────────────────────────────────────────────

type ReportType = 'applications' | 'scholarships' | 'users' | 'summary'

interface ReportDef {
    type: ReportType
    title: string
    description: string
    format: 'CSV' | 'PDF'
    icon: React.ReactNode
    color: string
}

const REPORTS: ReportDef[] = [
    {
        type: 'applications',
        title: 'Applications Report',
        description:
            'All submitted applications including student name, email, scholarship, status, city, and submission date.',
        format: 'CSV',
        icon: <FileText className="size-6" />,
        color: 'text-indigo-600 bg-indigo-50',
    },
    {
        type: 'scholarships',
        title: 'Scholarships Report',
        description:
            'All scholarships with provider info, status, type, deadline, creation date, and total application count.',
        format: 'CSV',
        icon: <GraduationCap className="size-6" />,
        color: 'text-emerald-600 bg-emerald-50',
    },
    {
        type: 'users',
        title: 'Users Report',
        description:
            'All registered users including full name, email, role, and email verification status.',
        format: 'CSV',
        icon: <Users className="size-6" />,
        color: 'text-amber-600 bg-amber-50',
    },
    {
        type: 'summary',
        title: 'Executive Summary',
        description:
            'Formatted PDF snapshot with key platform statistics and top scholarships by applications. Ideal for presentations.',
        format: 'PDF',
        icon: <FileDown className="size-6" />,
        color: 'text-rose-600 bg-rose-50',
    },
]

// ─── main component ───────────────────────────────────────────────────────────

const AdminReports = () => {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState<ReportType | null>(null)

    const handleDownload = async (type: ReportType) => {
        if (loading) return
        setLoading(type)
        try {
            const token = await getToken()
            await downloadReport(token!, type)
            toast.success('Report downloaded successfully')
        } catch {
            toast.error('Failed to download report. Please try again.')
        } finally {
            setLoading(null)
        }
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AdminSidebar />
                <SidebarInset className="flex-1">
                <Navbar showSidebarToggle={true} pageTitle="Reports" />
                <div className="flex flex-1 flex-col gap-6 p-6 bg-gray-50 overflow-y-auto">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                        <p className="text-gray-600 mt-1">
                            Download platform data as CSV or PDF for offline analysis and record-keeping.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {REPORTS.map((report) => (
                            <Card key={report.type} className="flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${report.color}`}>
                                            {report.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base">{report.title}</CardTitle>
                                            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                {report.format}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex flex-col flex-1 justify-between gap-4">
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {report.description}
                                    </p>

                                    <button
                                        onClick={() => handleDownload(report.type)}
                                        disabled={!!loading}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {loading === report.type ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Generating…
                                            </>
                                        ) : (
                                            <>
                                                <FileDown className="size-4" />
                                                Download {report.format}
                                            </>
                                        )}
                                    </button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Notes */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs text-gray-500 leading-relaxed">
                            <strong>CSV files</strong> can be opened in Microsoft Excel, Google Sheets, or any spreadsheet application.{' '}
                            <strong>PDF reports</strong> contain a pre-formatted summary and are suitable for sharing or printing.
                            All exports reflect the current state of the database at the time of download.
                        </p>
                    </div>
                </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}

export default AdminReports
