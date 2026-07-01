import { ReactFlow, Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'

interface GraphViewerProps {
  nodes: any[]
  edges: any[]
}

export function GraphViewer({ nodes, edges }: GraphViewerProps) {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      {nodes.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <h2>DAG Viewer</h2>
          <p>Compile LLVM IR to see the SelectionDAG graph here</p>
        </div>
      ) : (
        <ReactFlow nodes={nodes} edges={edges}>
          <Background />
          <Controls />
        </ReactFlow>
      )}
    </div>
  )
}
