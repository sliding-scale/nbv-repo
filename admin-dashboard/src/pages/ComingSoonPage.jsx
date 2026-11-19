import { Construction } from 'lucide-react'
import Card from '../components/common/Card'

export default function ComingSoonPage({ title }) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-1 px-4 py-12 text-center text-slate-500">
        <Construction size={32} />
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
        <p>This section is not built yet.</p>
      </div>
    </Card>
  )
}
