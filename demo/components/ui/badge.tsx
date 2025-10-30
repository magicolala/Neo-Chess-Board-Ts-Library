import * as React from 'react';
import { cn } from './utils';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'secondary' | 'default';
}

export function Badge({ className, variant = 'default', ...props }: Props) {
  const base = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium';
  const map: Record<'default' | 'secondary', string> = {
    default: 'bg-accent/15 text-white border border-borderc-light',
    secondary: 'bg-bg-secondary text-textc-secondary border border-borderc-light',
  };
  return <div className={cn(base, map[variant], className)} {...props} />;
}
