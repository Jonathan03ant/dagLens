import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from 'reactflow'
import { useEffect } from 'react'
import dagre from 'dagre'
import 'reactflow/dist/style.css'

interface GraphViewerProps {
  nodes: any[]
  edges: any[]
}

const getLayoutedElements = (nodes: any[], edges: any[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  dagreGraph.setGraph({ rankdir: 'BT', nodesep: 100, ranksep: 150 })

  // Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 })
  })

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 25,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

export function GraphViewer({ nodes, edges }: GraphViewerProps) {
  const [nodesState, setNodes, onNodesChange] = useNodesState([])
  const [edgesState, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (nodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges)
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    }
  }, [nodes, edges, setNodes, setEdges])

  return (
    <div style={{ height: '100%', width: '100%' }}>
      {nodes.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <h2>DAG Viewer</h2>
          <p>Compile LLVM IR to see the SelectionDAG graph here</p>
        </div>
      ) : (
        <ReactFlow
          nodes={nodesState}
          edges={edgesState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      )}
    </div>
  )
}
