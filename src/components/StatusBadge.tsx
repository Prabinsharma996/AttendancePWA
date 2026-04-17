import { clsx } from "clsx"

interface Props {
  status: string
  className?: string
}

export const StatusBadge = ({ status, className }: Props) => {
  let colorClass = 'bg-slate-500/20 text-slate-400'
  const lower = status.toLowerCase()

  if (lower === 'approved' || lower === 'active' || lower === 'entry') colorClass = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
  if (lower === 'pending') colorClass = 'bg-amber-500/20 text-amber-400 border border-amber-500/20'
  if (lower === 'rejected' || lower === 'cancelled' || lower === 'exit') colorClass = 'bg-red-500/20 text-red-400 border border-red-500/20'

  return (
    <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider", colorClass, className)}>
      {status}
    </span>
  )
}
