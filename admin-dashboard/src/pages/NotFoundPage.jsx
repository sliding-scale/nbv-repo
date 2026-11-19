import Card from '../components/common/Card'
import CardLink from '../components/common/CardLink'

export default function NotFoundPage() {
  return (
    <Card>
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Page not found</h2>
        <CardLink to="/">Back to dashboard</CardLink>
      </div>
    </Card>
  )
}
