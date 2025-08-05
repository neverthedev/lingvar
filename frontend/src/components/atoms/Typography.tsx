import React from 'react'

export interface TypographyProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'small' | 'caption'
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold'
  align?: 'left' | 'center' | 'right'
  children: React.ReactNode
  className?: string
}

export const Typography: React.FC<TypographyProps> = ({
  as: Component = 'p',
  variant = 'body',
  color = 'primary',
  weight = 'normal',
  align = 'left',
  children,
  className = '',
  ...props
}) => {
  const variantClasses = {
    h1: 'text-4xl md:text-6xl',
    h2: 'text-3xl md:text-5xl',
    h3: 'text-2xl md:text-3xl',
    h4: 'text-xl md:text-2xl',
    h5: 'text-lg md:text-xl',
    h6: 'text-base md:text-lg',
    body: 'text-base',
    small: 'text-sm',
    caption: 'text-xs'
  }

  const colorClasses = {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  }

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  }

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }

  const combinedClasses = `${variantClasses[variant]} ${colorClasses[color]} ${weightClasses[weight]} ${alignClasses[align]} ${className}`

  return (
    <Component className={combinedClasses} {...props}>
      {children}
    </Component>
  )
}
