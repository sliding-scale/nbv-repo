import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Clock, LoaderCircle, Search, Wallet } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@backend/_generated/api'
import Card from '../components/common/Card'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import PageHeading from '../components/common/PageHeading'
import StatCard from '../components/common/StatCard'
import Tabs from '../components/common/Tabs'
import { inputClass } from '../components/common/inputClass'
import FeeHistoryModal from '../components/finance/FeeHistoryModal'
import FinanceTable from '../components/finance/FinanceTable'
import MarkPaidModal from '../components/finance/MarkPaidModal'
import { useParents } from '../store/ParentsContext'
import { useStudents } from '../store/StudentsContext'
import { useVehicles } from '../store/VehiclesContext'
import { indexById } from '../utils/dashboard'
import { readMutationError } from '../utils/errors'
import { formatFee, formatMonth, monthInputValue, parseMonthInput, schoolYearMonth, toFeeRow } from '../utils/finance'

export default function FinancePage() {
  const { students, isLoading: studentsLoading } = useStudents()
  const { parents, isLoading: parentsLoading } = useParents()
  const { vehicles, isLoading: vehiclesLoading } = useVehicles()

  const ensureCurrentMonth = useMutation(api.admin.finance.ensureCurrentMonth)
  const markPaid = useMutation(api.admin.finance.markPaid)
  const markUnpaid = useMutation(api.admin.finance.markUnpaid)

  const current = schoolYearMonth()
  const currentValue = monthInputValue(current)
  const [monthValue, setMonthValue] = useState(currentValue)
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [ready, setReady] = useState(false)
  const [historyStudentId, setHistoryStudentId] = useState(null)
  const [paying, setPaying] = useState(null)
  const [unpaying, setUnpaying] = useState(null)

  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    ensureCurrentMonth({})
      .catch((err) => window.alert(readMutationError(err).message))
      .finally(() => setReady(true))
  }, [ensureCurrentMonth])

  const selected = parseMonthInput(monthValue || currentValue)
  const chargeDocs = useQuery(api.admin.finance.listMonth, selected)
  const arrears = useQuery(api.admin.finance.arrears, selected)
  const historyDocs = useQuery(api.admin.finance.history, historyStudentId ? { studentId: historyStudentId } : 'skip')

  const studentsById = useMemo(() => indexById(students), [students])
  const parentsById = useMemo(() => indexById(parents), [parents])
  const vehiclesById = useMemo(() => indexById(vehicles), [vehicles])

  const monthRows = useMemo(() => {
    if (!chargeDocs || arrears === undefined) return []
    return chargeDocs
      .map((charge) => toFeeRow(charge, studentsById, parentsById, vehiclesById, arrears[charge.studentId] ?? 0))
      .sort((a, b) => a.studentName.localeCompare(b.studentName))
  }, [chargeDocs, arrears, studentsById, parentsById, vehiclesById])

  const summary = useMemo(() => {
    let expected = 0
    let collected = 0
    let pending = 0
    let paidCount = 0
    for (const row of monthRows) {
      expected += row.amount
      if (row.status === 'paid') {
        collected += row.amount
        paidCount += 1
      } else {
        pending += row.amount
      }
    }
    return { expected, collected, pending, paidCount, pendingCount: monthRows.length - paidCount }
  }, [monthRows])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return monthRows.filter((row) => {
      if (statusFilter === 'paid' && row.status !== 'paid') return false
      if (statusFilter === 'unpaid' && row.status !== 'pending') return false
      if (!q) return true
      return [row.studentName, row.parentLabel].some((field) => field.toLowerCase().includes(q))
    })
  }, [monthRows, statusFilter, query])

  const historyStudent = historyStudentId ? studentsById[historyStudentId] : null
  const historyRows = useMemo(() => {
    if (!historyDocs) return []
    return historyDocs.map((charge) => toFeeRow(charge, studentsById, parentsById, vehiclesById))
  }, [historyDocs, studentsById, parentsById, vehiclesById])

  const loading =
    !ready ||
    chargeDocs === undefined ||
    arrears === undefined ||
    studentsLoading ||
    parentsLoading ||
    vehiclesLoading

  const confirmUnpaid = async () => {
    const row = unpaying
    setUnpaying(null)
    try {
      await markUnpaid({ id: row.id })
    } catch (err) {
      window.alert(readMutationError(err).message)
    }
  }

  const monthLabel = formatMonth(selected.year, selected.month)

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Finance"
        description={`${monthLabel}. Each row is that student’s own monthly fee.`}
      />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total expected" value={loading ? '…' : formatFee(summary.expected)} icon={Wallet} tone="blue" hint={loading ? 'This month' : `${monthRows.length} students`} />
            <StatCard
              label="Total collected"
              value={loading ? '…' : formatFee(summary.collected)}
              icon={BadgeCheck}
              tone="green"
              hint={loading ? 'Paid rows' : `${summary.paidCount} paid`}
            />
            <StatCard
              label="Total pending"
              value={loading ? '…' : formatFee(summary.pending)}
              icon={Clock}
              tone="amber"
              hint={loading ? 'Unpaid rows' : `${summary.pendingCount} pending`}
            />
          </div>

          <Card>
            <div className="-mx-5 -mt-4 -mb-5">
              <div className="px-5 pt-2">
                <Tabs
                  label="Filter by payment status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  tabs={[
                    { id: 'all', label: 'All', count: loading ? undefined : monthRows.length },
                    { id: 'paid', label: 'Paid', count: loading ? undefined : summary.paidCount },
                    { id: 'unpaid', label: 'Unpaid', count: loading ? undefined : summary.pendingCount },
                  ]}
                />
              </div>
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center">
                <label className="relative flex-1">
                  <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by student or parent…"
                    className={`${inputClass()} pl-9`}
                  />
                </label>
                <input
                  type="month"
                  value={monthValue}
                  max={currentValue}
                  onChange={(e) => {
                    if (e.target.value) setMonthValue(e.target.value)
                  }}
                  className={`${inputClass()} sm:w-44`}
                  aria-label="Month"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
                  <LoaderCircle size={18} className="animate-spin" /> Loading fees…
                </div>
              ) : visible.length === 0 ? (
                <div className="p-8 text-center">
                  <EmptyState>
                    {monthRows.length === 0 ? (
                      <>
                        No fee rows for {monthLabel}. Set a monthly fee on each student in{' '}
                        <Link to="/students" className="font-medium text-blue-600 hover:underline">
                          Student management
                        </Link>{' '}
                        and active students are billed here.
                      </>
                    ) : (
                      'No students match these filters.'
                    )}
                  </EmptyState>
                </div>
              ) : (
                <FinanceTable
                  rows={visible}
                  onOpenHistory={(row) => setHistoryStudentId(row.studentId)}
                  onMarkPaid={setPaying}
                  onMarkUnpaid={setUnpaying}
                />
              )}
            </div>
          </Card>

      {historyStudentId && (
        <FeeHistoryModal
          studentName={historyStudent?.fullName ?? 'Student'}
          rows={historyRows}
          loading={historyDocs === undefined}
          onClose={() => setHistoryStudentId(null)}
          onMarkPaid={setPaying}
          onMarkUnpaid={setUnpaying}
        />
      )}

      {paying && <MarkPaidModal key={paying.id} row={paying} onClose={() => setPaying(null)} onConfirm={markPaid} />}

      <ConfirmDialog
        open={Boolean(unpaying)}
        title={unpaying ? `Mark ${unpaying.studentName} unpaid?` : 'Mark unpaid?'}
        message={
          unpaying
            ? `${formatMonth(unpaying.year, unpaying.month)} goes back to pending, and the paid date is cleared.`
            : ''
        }
        confirmLabel="Mark unpaid"
        danger
        onCancel={() => setUnpaying(null)}
        onConfirm={confirmUnpaid}
      />
    </div>
  )
}
