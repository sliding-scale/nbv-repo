import { LoaderCircle } from 'lucide-react'
import Badge from '../common/Badge'
import Button from '../common/Button'
import Modal from '../common/Modal'
import { formatFee, formatMonth, formatPaidDate } from '../../utils/finance'

export default function FeeHistoryModal({ studentName, rows, loading, onClose, onMarkPaid, onMarkUnpaid }) {
  return (
    <Modal open size="lg" title={`${studentName}'s fee history`} description="Mark any month paid or unpaid on its own." onClose={onClose}>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <LoaderCircle size={18} className="animate-spin" /> Loading history…
        </div>
      ) : rows.length === 0 ? (
        <p className="py-6 text-sm text-slate-500">No fee rows saved for this student yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-[0.72rem] font-semibold tracking-wide text-slate-500 uppercase">
                <th className="pb-2 pr-3">Month</th>
                <th className="pb-2 pr-3">Amount</th>
                <th className="pb-2 pr-3">Status</th>
                <th className="pb-2 pr-3">Paid date</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => {
                const paid = row.status === 'paid'
                return (
                  <tr key={row.id}>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-slate-800">{formatMonth(row.year, row.month)}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums text-slate-800">{formatFee(row.amount)}</td>
                    <td className="py-2.5 pr-3">
                      <Badge tone={paid ? 'green' : 'amber'}>{paid ? 'Paid' : 'Pending'}</Badge>
                    </td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-slate-600">
                      {row.paidAt ? formatPaidDate(row.paidAt) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-2.5 text-right">
                      {paid ? (
                        <Button size="sm" variant="secondary" onClick={() => onMarkUnpaid(row)}>
                          Mark unpaid
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => onMarkPaid(row)}>
                          Mark paid
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
