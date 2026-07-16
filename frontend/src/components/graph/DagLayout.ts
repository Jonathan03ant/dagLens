import dagre from 'dagre'
import { NODE_STYLES, EDGE_STYLES, LAYOUT_CONFIG } from './nodeStyles'

/**
 * Layout nodes and edges using Dagre algorithm
 * Pure function - no side effects
 */
export function layoutDag(nodes: any[], edges: any[]) {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  dagreGraph.setGraph({
    rankdir: LAYOUT_CONFIG.rankdir,
    nodesep: LAYOUT_CONFIG.nodesep,
    ranksep: LAYOUT_CONFIG.ranksep,
  })

  // Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: LAYOUT_CONFIG.nodeWidth,
      height: LAYOUT_CONFIG.nodeHeight,
    })
  })

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  // Apply positions and styling to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)

    // Build label: opcode + node_num
    const opcode = node.data.opcode || '?'
    const nodeNum = node.data.node_num || '?'
    const displayLabel = `${opcode}\n${nodeNum}`

    return {
      ...node,
      data: {
        ...node.data,
        label: displayLabel,
      },
      position: {
        x: nodeWithPosition.x - LAYOUT_CONFIG.nodeWidth / 2,
        y: nodeWithPosition.y - LAYOUT_CONFIG.nodeHeight / 2,
      },
      style: NODE_STYLES,
    }
  })

  // Apply styling to edges based on type
  const layoutedEdges = edges.map((edge) => {
    const edgeType = edge.type || 'data'
    const style = EDGE_STYLES[edgeType as keyof typeof EDGE_STYLES] || EDGE_STYLES.data

    return {
      ...edge,
      style,
      animated: false,
    }
  })

  return { nodes: layoutedNodes, edges: layoutedEdges }
}
