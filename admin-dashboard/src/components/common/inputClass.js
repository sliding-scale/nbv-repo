// Shared Tailwind classes for text inputs and selects.
export const inputClass = (hasError) =>
  `h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 ${
    hasError ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:border-blue-400 focus:ring-blue-100'
  }`
