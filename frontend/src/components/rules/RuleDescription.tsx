function ruleDescriptionPreview(html: string): string {
  // Descriptions arrive from the server's canonical serializer. It emits the
  // remaining special characters as these entities, so this intentionally
  // small decoder has identical output during SSR and hydration.
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|nbsp);/gi, (_, entity: string) => ({ amp: '&', lt: '<', gt: '>', nbsp: ' ' })[entity.toLowerCase()] ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function RuleDescriptionPreview({ html }: { html: string }) {
  return <>{ruleDescriptionPreview(html)}</>
}

export function RuleDescription({ html, compact = false, className = '' }: { html: string; compact?: boolean; className?: string }) {
  return <div
    className={`rule-description min-w-0 ${compact ? 'rule-description--compact' : ''} ${className}`}
    dangerouslySetInnerHTML={{ __html: html }}
  />
}
