import * as React from 'react'
import { cn } from '@/lib/utils'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'danger'; size?: 'default' | 'sm' | 'icon' }

export const Button = React.forwardRef<HTMLButtonElement, Props>(({ className, variant = 'default', size = 'default', ...props }, ref) => (
  <button ref={ref} className={cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-50',
    variant === 'default' && 'bg-primary text-primary-foreground hover:brightness-110',
    variant === 'outline' && 'border border-border bg-transparent hover:bg-muted',
    variant === 'ghost' && 'hover:bg-muted',
    variant === 'danger' && 'bg-red-500 text-white hover:bg-red-400',
    size === 'default' && 'h-10 px-4 text-sm', size === 'sm' && 'h-8 px-3 text-sm', size === 'icon' && 'size-10', className,
  )} {...props} />
))
Button.displayName = 'Button'
