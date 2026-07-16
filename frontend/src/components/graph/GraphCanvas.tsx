import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from 'reactflow'
import { useEffect } from 'react'
import 'reactflow/dist/style.css'

interface GraphCanvasProps {
  nodes: any[]
  edges: any[]
  onNodeClick?: (event: any, node: any) => void
  onEdgeClick?: (event: any, edge: any) => void
  onPaneClick?: () => void
}

/**
 * ReactFlow wrapper with styled background and controls
 * Reusable across SelectionDAG, MIR, and other graph visualizations
 */
export function GraphCanvas({ nodes, edges, onNodeClick, onEdgeClick, onPaneClick }: GraphCanvasProps) {
  const [nodesState, setNodes, onNodesChange] = useNodesState([])
  const [edgesState, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    // Clear and reset when new data arrives
    setNodes([])
    setEdges([])

    if (nodes.length > 0) {
      // Use setTimeout to force React Flow to fully reset
      setTimeout(() => {
        setNodes(nodes)
        setEdges(edges)
      }, 0)
    }
  }, [nodes, edges, setNodes, setEdges])

  if (nodes.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        <h2>DAG Viewer</h2>
        <p>Compile LLVM IR to see the SelectionDAG graph here</p>
      </div>
    )
  }

  return (
    <ReactFlow
      key={`${nodes.length}-${edges.length}`}
      nodes={nodesState}
      edges={edgesState}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      fitView
    >
      <Background color="#18a018" gap={16} size={1} style={{ backgroundColor: '#0a0a0a' }} />
      <Controls />
    </ReactFlow>
  )
}
