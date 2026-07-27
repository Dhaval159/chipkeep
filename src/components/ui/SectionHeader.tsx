interface SectionHeaderProps {
  title: string
  subtitle?: string
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="ck-section">
      <h2 className="ck-section__title">{title}</h2>
      {subtitle && <p className="ck-section__subtitle">{subtitle}</p>}
    </div>
  )
}
