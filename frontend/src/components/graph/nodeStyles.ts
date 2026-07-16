/**
 * Styling constants for DAG/MIR graph nodes and edges
 */

export const NODE_STYLES = {
  background: '#0a0a0a',
  color: '#18a018',
  border: '1px solid #18a018',
  borderRadius: '3px',
  padding: '10px',
  fontSize: '12px',
  fontFamily: 'JetBrains Mono, monospace',
  whiteSpace: 'pre-line' as const,
  textAlign: 'center' as const,
  minWidth: '100px',
}

export const EDGE_COLORS = {
  data: '#8b5cf6',    // Purple - data edges
  chain: '#3b82f6',   // Blue - chain edges (ordering/side effects)
  glue: '#ef4444',    // Red - glue edges (special dependencies)
}

export const EDGE_STYLES = {
  data: {
    stroke: EDGE_COLORS.data,
    strokeWidth: 2,
    strokeDasharray: undefined,
  },
  chain: {
    stroke: EDGE_COLORS.chain,
    strokeWidth: 2,
    strokeDasharray: '5,5',  // Dashed for chain edges
  },
  glue: {
    stroke: EDGE_COLORS.glue,
    strokeWidth: 2,
    strokeDasharray: undefined,
  },
}

export const LAYOUT_CONFIG = {
  rankdir: 'TB',      // Top to bottom
  nodesep: 100,       // Horizontal spacing
  ranksep: 150,       // Vertical spacing
  nodeWidth: 150,
  nodeHeight: 50,
}
