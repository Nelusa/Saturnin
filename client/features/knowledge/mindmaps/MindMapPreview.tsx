import type { MindMap } from "~/types/knowledge";

/** A compact rendering of the actual graph, rather than a decorative placeholder. */
export function MindMapPreview({ map }: { map: MindMap }) {
  const nodes = map.nodes;
  if (!nodes.length) return <span className="text-xs text-muted-foreground">Prázdná mapa</span>;
  const left = Math.min(...nodes.map(node => node.x)) - 70;
  const top = Math.min(...nodes.map(node => node.y)) - 35;
  const width = Math.max(250, Math.max(...nodes.map(node => node.x)) - left + 70);
  const height = Math.max(140, Math.max(...nodes.map(node => node.y)) - top + 35);
  const byId = new Map(nodes.map(node => [node.id, node]));
  return <svg aria-hidden="true" viewBox={`${left} ${top} ${width} ${height}`} className="h-full w-full p-5" preserveAspectRatio="xMidYMid meet">
    {map.connections.map(edge => {
      const from = byId.get(edge.sourceId), to = byId.get(edge.targetId);
      return from && to ? <line key={edge.id} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="currentColor" className="text-primary/25" strokeWidth="2" /> : null;
    })}
    {nodes.map(node => <g key={node.id} transform={`translate(${node.x},${node.y})`}>
      <rect x="-55" y="-16" width="110" height="32" rx="7" fill="currentColor" className="text-background" stroke="currentColor" />
      <text textAnchor="middle" dominantBaseline="central" fontSize="10" fill="currentColor" className="text-foreground">{node.text.length > 18 ? `${node.text.slice(0, 17)}…` : node.text}</text>
    </g>)}
  </svg>;
}
