import type { ReactNode } from 'react'

type PlaceholderSectionProps = {
  title: string
  description: string
  badge?: string
  children?: ReactNode
}

export function PlaceholderSection({
  title,
  description,
  badge,
  children,
}: PlaceholderSectionProps) {
  return (
    <section className="placeholder-section">
      {badge ? <p className="card-label">{badge}</p> : null}
      <h2>{title}</h2>
      <p className="placeholder-copy">{description}</p>
      {children}
    </section>
  )
}
