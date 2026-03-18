import { cn } from '@/lib/utils';

interface ContainerProps {
  className?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeStyles = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export function Container({ className, children, size = 'xl' }: ContainerProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto px-[clamp(1rem,5vw,2rem)]',
        sizeStyles[size],
        className
      )}
    >
      {children}
    </div>
  );
}
