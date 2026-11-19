import Badge from '../common/Badge'
import Button from '../common/Button'
import { arrearsLabel, formatFee, formatMonth, formatPaidDate } from '../../utils/finance'

const th =
  'whitespace-nowrap border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-[0.72rem] font-semibold tracking-wide text-slate-500 uppercase'
const td = 'px-4 py-3 align-middle'

function People({ label }) {
  if (!label) return <span className="text-xs font-medium text-amber-600">None</span>
  return (
    <span className="block max-w-48 truncate text-slate-700" title={label}>
      {label}
    </span>
  )
}

export default function FinanceTable({ rows, onOpenHistory, onMarkPaid, onMarkUnpaid }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={th}>Student</th>
            <th className={th}>Parent</th>
            <th className={th}>Van</th>
            <th className={th}>Month</th>
            <th className={th}>Amount</th>
            <th className={th}>Status</th>
            <th className={th}>Paid date</th>
            <th className={`${th} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const paid = row.status === 'paid'
            return (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className={td}>
                  <button type="button" onClick={() => onOpenHistory(row)} className="cursor-pointer text-left">
                    <div className="font-semibold whitespace-nowrap text-slate-900 hover:underline">{row.studentName}</div>
                    {row.arrears > 0 && (
                      <div className="mt-1">
                        <Badge tone="amber">{arrearsLabel(row.arrears)}</Badge>
                      </div>
                    )}
                  </button>
                </td>
                <td className={td}>
                  <People label={row.parentLabel} />
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  {row.vanName ? <span className="text-slate-900">{row.vanName}</span> : <span className="text-slate-400">Not assigned</span>}
                </td>
                <td className={`${td} whitespace-nowrap text-slate-700`}>{formatMonth(row.year, row.month)}</td>
                <td className={`${td} whitespace-nowrap font-medium text-slate-900 tabular-nums`}>{formatFee(row.amount)}</td>
                <td className={td}>
                  <Badge tone={paid ? 'green' : 'amber'}>{paid ? 'Paid' : 'Pending'}</Badge>
                </td>
                <td className={`${td} whitespace-nowrap text-slate-600`}>
                  {row.paidAt ? formatPaidDate(row.paidAt) : <span className="text-slate-400">—</span>}
                </td>
                <td className={td}>
                  <div className="flex justify-end">
                    {paid ? (
                      <Button size="sm" variant="secondary" onClick={() => onMarkUnpaid(row)}>
                        Mark unpaid
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => onMarkPaid(row)}>
                        Mark paid
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
