import { TriangleAlert } from 'lucide-react'

export default function ConfigError({ children }) {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <div className="mb-2 flex items-center gap-2 font-semibold">
          <TriangleAlert size={18} /> Configuration missing
        </div>
        <p className="[&_code]:rounded [&_code]:bg-amber-100 [&_code]:px-1 [&_code]:font-mono">{children}</p>
      </div>
    </div>
  )
}
