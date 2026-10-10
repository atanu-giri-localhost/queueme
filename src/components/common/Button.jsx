export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconRight: IconRight,
  disabled = false,
  onClick,
  type = 'button',
  id,
  title,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

  const variants = {
    primary:
      'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 active:scale-[0.98] border border-indigo-500/30',
    secondary:
      'bg-zinc-800 hover:bg-zinc-750 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/80 active:scale-[0.98]',
    ghost:
      'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 border border-transparent active:scale-[0.98]',
    outline:
      'border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white bg-transparent active:scale-[0.98]',
    subtle:
      'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800/80 active:scale-[0.98]',
    danger:
      'bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 active:scale-[0.98]',
  };

  const sizes = {
    xs: 'text-xs px-2.5 py-1 rounded-md gap-1.5',
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-3.5 py-2 rounded-lg gap-2',
    lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5',
    icon: 'p-2 rounded-lg',
    iconSm: 'p-1.5 rounded-md',
  };

  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' || size === 'xs' || size === 'iconSm' ? 'w-4 h-4' : 'w-4 h-4'} />}
      {children}
      {IconRight && <IconRight className={size === 'sm' || size === 'xs' ? 'w-4 h-4' : 'w-4 h-4'} />}
    </button>
  );
}
