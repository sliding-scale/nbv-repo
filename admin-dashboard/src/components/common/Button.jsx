const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-slate-600 hover:bg-slate-100',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
}

export default function Button({ variant = 'primary', size = 'md', icon: Icon, className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  )
}
