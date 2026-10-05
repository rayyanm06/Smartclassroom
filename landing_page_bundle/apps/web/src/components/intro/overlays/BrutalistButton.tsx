import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface BrutalistButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export function BrutalistButton({
  children,
  variant = 'primary',
  size = 'lg',
  className = '',
  ...props
}: BrutalistButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'lp-btn-primary'
      : variant === 'accent'
      ? 'lp-btn-accent'
      : 'lp-btn-secondary';

  const sizeClass =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : size === 'md'
      ? 'px-5 py-2.5 text-sm'
      : 'px-8 py-4 text-base md:text-lg min-h-[60px]';

  return (
    <button
      className={`lp-btn ${variantClass} ${sizeClass} select-none font-bold tracking-wider inline-flex items-center justify-center gap-3 transition-transform cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
