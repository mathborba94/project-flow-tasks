'use client'

import { useEffect, useRef, ReactNode } from 'react'

export default function Reveal({
  children,
  delay = 0,
  className = '',
  y = 22,
}: {
  children: ReactNode
  delay?: number
  className?: string
  y?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.visible = 'true'
          observer.unobserve(el)
        }
      },
      { threshold: 0.07, rootMargin: '0px 0px -48px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-visible="false"
      style={{
        transitionDelay: delay ? `${delay}ms` : undefined,
        '--reveal-y': `${y}px`,
      } as React.CSSProperties}
      className={`reveal-item ${className}`}
    >
      {children}
    </div>
  )
}
