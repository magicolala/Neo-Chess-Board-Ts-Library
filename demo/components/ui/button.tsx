import * as React from 'react';
import { cn } from './utils';

type Variant = 'default' | 'secondary' | 'ghost';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ className, variant = 'default', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-md text-sm px-3 py-2 transition-colors';

  const styles: Record<Variant, string> = {
    default: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'bg-bg-secondary border border-borderc-light text-textc-secondary hover:bg-bg-hover',
    ghost: 'bg-transparent text-textc-secondary hover:bg-bg-hover',
  };

  return <button className={cn(base, styles[variant], className)} {...props} />;
}
