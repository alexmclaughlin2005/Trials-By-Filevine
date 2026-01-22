import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-filevine-black text-white hover:bg-filevine-gray-900',
        primary: 'bg-filevine-blue text-white hover:bg-filevine-blue/90',
        success: 'bg-filevine-green text-white hover:bg-filevine-green/90',
        warning: 'bg-filevine-orange text-white hover:bg-filevine-orange/90',
        destructive: 'bg-filevine-red text-white hover:bg-filevine-red/90',
        outline: 'border border-filevine-gray-300 bg-white hover:bg-filevine-gray-50',
        secondary: 'bg-filevine-gray-200 text-filevine-gray-900 hover:bg-filevine-gray-300',
        ghost: 'hover:bg-filevine-gray-100 hover:text-filevine-gray-900',
        link: 'text-filevine-blue underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded px-3 text-xs',
        lg: 'h-10 rounded px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
