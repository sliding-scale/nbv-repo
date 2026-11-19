import { LoaderCircle } from 'lucide-react'

export default function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center text-slate-400">
      <LoaderCircle size={28} className="animate-spin" />
    </div>
  )
}
