import { Link } from 'react-router-dom'

export default function CardLink({ to, children }) {
  return (
    <Link to={to} className="text-[0.82rem] font-semibold whitespace-nowrap text-blue-600 hover:underline">
      {children}
    </Link>
  )
}
