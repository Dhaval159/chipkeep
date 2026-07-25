interface SectionHeaderProps {
  title: string
  subtitle?: string
  className?: string
}

export function SectionHeader({ title, subtitle, className = '' }: SectionHeaderProps) {
  return (
    <div className={`ck-section-header ${className}`}>
      <h2 className="ck-section-header__title">{title}</h2>
      {subtitle && <p className="ck-section-header__subtitle">{subtitle}</p>}
    </div>
  )
}
