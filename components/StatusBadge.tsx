export function StatusBadge({
  label,
  colorClass,
}: {
  label: string;
  colorClass: string;
}) {
  return <span className={`badge ${colorClass}`}>{label}</span>;
}
