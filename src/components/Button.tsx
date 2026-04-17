import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}

const VARIANT_CLASSES = {
  primary:   'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20 disabled:bg-sky-800',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600',
  danger:    'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20',
  ghost:     'bg-transparent hover:bg-slate-800 text-slate-300',
}
const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
}

export const Button = ({
  children, variant = 'primary', size = 'md', loading, icon, className, disabled, ...props
}: Props) => (
  <button
    disabled={disabled || loading}
    className={clsx(
      'inline-flex items-center gap-2 font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95',
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      className
    )}
    {...props}
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
    {children}
  </button>
)
