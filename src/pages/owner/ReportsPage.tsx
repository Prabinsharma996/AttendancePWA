import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, FileSpreadsheet, Calendar as CalendarIcon, Filter } from 'lucide-react'
import { format, subDays } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { useAuthStore } from '../../store/authStore'
import { getLiveLogsToday } from '../../api/attendance' // Pretend this fetches historical for now
import { Button } from '../../components/Button'

export default function ReportsPage() {
  const { user, organization } = useAuthStore()
  
  // Date range state
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: logs = [], isLoading } = useQuery({ 
    queryKey: ['report_logs', user?.org_id, startDate, endDate], 
    queryFn: () => getLiveLogsToday(user!.org_id!), // Simplified fetch for demonstration
    enabled: !!user?.org_id
  })

  // Export PDF using jsPDF + autotable
  const exportPDF = () => {
    const doc = new jsPDF()
    doc.text(`${organization?.name || 'Organization'} - Attendance Report`, 14, 15)
    doc.setFontSize(10)
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 22)

    const tableData = logs.map(l => [
      l.user?.full_name || 'Unknown',
      l.user?.department || '-',
      format(new Date(l.timestamp), 'MMM dd, yyyy'),
      format(new Date(l.timestamp), 'HH:mm'),
      l.type.toUpperCase(),
      l.is_valid ? 'Valid' : 'Flagged'
    ])

    // @ts-ignore - jspdf-autotable extends jsPDF but types can be finicky
    doc.autoTable({
      startY: 28,
      head: [['Employee', 'Department', 'Date', 'Time', 'Type', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
    })

    doc.save(`Attendance_Report_${startDate}_to_${endDate}.pdf`)
  }

  // Export Excel using xlsx
  const exportExcel = () => {
    const worksheetData = logs.map(l => ({
      'Employee': l.user?.full_name || 'Unknown',
      'Department': l.user?.department || '-',
      'Date': format(new Date(l.timestamp), 'MMM dd, yyyy'),
      'Time': format(new Date(l.timestamp), 'HH:mm'),
      'Type': l.type.toUpperCase(),
      'Status': l.is_valid ? 'Valid' : 'Flagged',
      'Verified via Biometric': l.biometric_verified ? 'Yes' : 'No'
    }))

    const ws = XLSX.utils.json_to_sheet(worksheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Attendance")
    XLSX.writeFile(wb, `Attendance_Report_${startDate}_to_${endDate}.xlsx`)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Reports & Exports</h1>
          <p className="text-slate-400 text-sm">Generate and download comprehensive attendance reports.</p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass rounded-xl p-5 border border-slate-700/50 flex flex-col lg:flex-row gap-6 lg:items-end justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Start Date</label>
            <div className="relative">
              <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} 
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">End Date</label>
            <div className="relative">
              <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} 
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50" />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={exportExcel} icon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}>
            Export Excel
          </Button>
          <Button onClick={exportPDF} icon={<FileText className="w-4 h-4" />}>
            Export PDF
          </Button>
        </div>
      </div>

      {/* Preview Table */}
      <div className="glass rounded-xl overflow-hidden border border-slate-700/50 flex-1">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Filter className="w-4 h-4 text-sky-400"/> Data Preview</h3>
          <span className="text-xs text-slate-400">{logs.length} records found</span>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 sticky top-0 border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-wider backdrop-blur-md">
                <th className="p-4 font-semibold">Date & Time</th>
                <th className="p-4 font-semibold">Employee</th>
                <th className="p-4 font-semibold">Event</th>
                <th className="p-4 font-semibold">Biometrics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading records...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No records found in this range.</td></tr>
              ) : (
                logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-sm">
                      <p className="text-white font-medium">{format(new Date(l.timestamp), 'MMM dd, yyyy')}</p>
                      <p className="text-xs text-slate-400">{format(new Date(l.timestamp), 'HH:mm:ss a')}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-300">{l.user?.full_name}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${l.type === 'entry' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                        {l.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">{l.biometric_verified ? 'Verified' : 'Bypassed'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
