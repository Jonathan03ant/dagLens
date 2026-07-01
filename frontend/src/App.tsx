import { useState } from 'react'
import { InputPanel } from './components/InputPanel'
import { GraphViewer } from './components/GraphViewer'
import './App.css'

function App() {
  const [nodes, setNodes] = useState<any[]>([])
  const [edges, setEdges] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleCompile = async (irCode: string, stage: string) => {
    setLoading(true)

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ir_code: irCode, stage: stage })
      })

      const data = await response.json()
      setNodes(data.nodes || [])
      setEdges(data.edges || [])
    } catch (error) {
      console.error('Compile error:', error)
      alert('Failed to compile. Check console.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '15px 20px',
        backgroundColor: '#1e1e1e',
        color: 'white',
        borderBottom: '1px solid #333'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>DagLens - SelectionDAG Viewer</h1>
      </div>

      {/* 2-Panel Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left Panel - Input (30%) */}
        <div style={{
          width: '30%',
          borderRight: '1px solid #ddd',
          backgroundColor: '#f5f5f5',
          overflow: 'auto'
        }}>
          <InputPanel onCompile={handleCompile} />
        </div>

        {/* Right Panel - Graph (70%) */}
        <div style={{ width: '70%', position: 'relative' }}>
          {loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '20px'
            }}>
              Compiling...
            </div>
          )}
          <GraphViewer nodes={nodes} edges={edges} />
        </div>
      </div>
    </div>
  )
}

export default App
