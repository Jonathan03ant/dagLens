import { useState, useEffect } from 'react'
import { GraphCanvas, NodeDetailsPanel, layoutDag } from '../graph'

interface SelectionDAGViewerProps {
  nodes: any[]
  edges: any[]
}

/**
 * SelectionDAG visualization tool
 * Orchestrates graph layout, rendering, and interaction
 */
export function SelectionDAGViewer({ nodes, edges }: SelectionDAGViewerProps) {
  const [layoutedNodes, setLayoutedNodes] = useState<any[]>([])
  const [layoutedEdges, setLayoutedEdges] = useState<any[]>([])
  const [allNodes, setAllNodes] = useState<any[]>([])
  const [allEdges, setAllEdges] = useState<any[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [overlayPosition, setOverlayPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Layout nodes/edges when data changes
  useEffect(() => {
    console.log('🔄 New graph data received:', nodes.length, 'nodes,', edges.length, 'edges')

    // Clear state
    setLayoutedNodes([])
    setLayoutedEdges([])
    setSelectedNodeId(null)
    setOverlayPosition(null)
    setIsDragging(false)

    if (nodes.length > 0) {
      const { nodes: laidOutNodes, edges: laidOutEdges } = layoutDag(nodes, edges)
      setAllNodes(laidOutNodes)
      setAllEdges(laidOutEdges)
      setLayoutedNodes(laidOutNodes)
      setLayoutedEdges(laidOutEdges)
    }
  }, [nodes, edges])

  // Node click handler
  const handleNodeClick = (event: any, node: any) => {
    if (selectedNodeId === node.id) {
      // Deselect - restore all nodes/edges
      setSelectedNodeId(null)
      setOverlayPosition(null)
      setLayoutedEdges(allEdges)
      setLayoutedNodes(allNodes.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } })))
    } else {
      // Select node - filter edges and dim unconnected nodes
      setSelectedNodeId(node.id)

      // Find connected edges
      const connectedEdges = allEdges.filter((edge) => edge.source === node.id || edge.target === node.id)

      // Build set of connected node IDs
      const connectedNodeIds = new Set<string>([node.id])
      connectedEdges.forEach((edge) => {
        connectedNodeIds.add(edge.source)
        connectedNodeIds.add(edge.target)
      })

      // Dim unconnected nodes
      setLayoutedNodes(
        allNodes.map((n) => ({
          ...n,
          style: {
            ...n.style,
            opacity: connectedNodeIds.has(n.id) ? 1 : 0.2,
          },
        }))
      )

      // Show only connected edges
      setLayoutedEdges(connectedEdges)

      // Position overlay near click
      setOverlayPosition({ x: event.clientX, y: event.clientY })
    }
  }

  // Edge click handler (placeholder)
  const handleEdgeClick = (_event: any, edge: any) => {
    console.log('Edge clicked:', edge)
    // TODO: Highlight edge, show edge details
  }

  // Pane click handler - deselect
  const handlePaneClick = () => {
    setSelectedNodeId(null)
    setOverlayPosition(null)
    setLayoutedEdges(allEdges)
    setLayoutedNodes(allNodes.map((n) => ({ ...n, style: { ...n.style, opacity: 1 } })))
  }

  // Overlay drag handlers
  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (overlayPosition) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - overlayPosition.x,
        y: e.clientY - overlayPosition.y,
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && overlayPosition) {
      setOverlayPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add/remove drag listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset])

  // Get selected node and its connections
  const selectedNode = selectedNodeId ? allNodes.find((n) => n.id === selectedNodeId) : null
  const inputs = selectedNodeId ? allEdges.filter((e) => e.target === selectedNodeId) : []
  const outputs = selectedNodeId ? allEdges.filter((e) => e.source === selectedNodeId) : []

  return (
    <div style={{ height: '100%', width: '100%', backgroundColor: '#0a0a0a', position: 'relative' }}>
      <GraphCanvas
        nodes={layoutedNodes}
        edges={layoutedEdges}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
      />

      {/* Floating Node Details Panel */}
      {selectedNode && overlayPosition && (
        <NodeDetailsPanel
          node={selectedNode}
          inputs={inputs}
          outputs={outputs}
          allNodes={allNodes}
          position={overlayPosition}
          isDragging={isDragging}
          onMouseDown={handleOverlayMouseDown}
        />
      )}
    </div>
  )
}
