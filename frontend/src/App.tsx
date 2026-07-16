import { useState } from 'react'
import { Header, InputPanel, Footer } from './components/common'
import type { TerminalLine } from './components/common'
import { SelectionDAGViewer } from './components/tools'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('selectiondag')
  const [nodes, setNodes] = useState<any[]>([])
  const [edges, setEdges] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [irCode, setIrCode] = useState('')
  const [stage, setStage] = useState('isel')
  const [terminalOutput, setTerminalOutput] = useState<TerminalLine[]>([])

  // Settings - user editable llc path
  const [llcPath, setLlcPath] = useState('/path/to/llc')
  const arch = 'amdgcn'
  const cpu = 'gfx1101'

  const handleRun = async () => {
    if (!irCode.trim()) {
      alert('Please paste LLVM IR code first')
      return
    }

    setLoading(true)

    // Clear previous output and show command
    const timestamp = new Date().toLocaleTimeString()
    setTerminalOutput([{
      type: 'command',
      text: `llc -march=${arch} -mcpu=${cpu} -view-${stage}-dags input.ll`,
      timestamp
    }])

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ir_code: irCode,
          stage: stage,
          llc_path: llcPath.trim()
        })
      })

      const data = await response.json()

      // Update terminal output with backend response
      if (data.terminal_output) {
        setTerminalOutput(data.terminal_output)
      }

      setNodes(data.nodes || [])
      setEdges(data.edges || [])
    } catch (error) {
      console.error('Compile error:', error)
      setTerminalOutput(prev => [...prev, {
        type: 'error',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString()
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Tabs */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 2-Panel Layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#000000' }}>
        {/* Left Panel - Input (40%) */}
        <div style={{
          width: '40%',
          borderRight: '1px solid #1a1a1a',
          backgroundColor: '#0a0a0a',
          overflow: 'auto'
        }}>
          <InputPanel
            value={irCode}
            onChange={setIrCode}
            terminalOutput={terminalOutput}
            isRunning={loading}
          />
        </div>

        {/* Right Panel - Graph (60%) */}
        <div style={{ width: '60%', position: 'relative', backgroundColor: '#0a0a0a' }}>
          {loading && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '20px',
              color: '#18a018'
            }}>
              Running...
            </div>
          )}
          <SelectionDAGViewer nodes={nodes} edges={edges} />
        </div>
      </div>

      {/* Footer */}
      <Footer
        llcPath={llcPath}
        onLlcPathChange={setLlcPath}
        arch={arch}
        cpu={cpu}
        stage={stage}
        onStageChange={setStage}
        onRun={handleRun}
        isLoading={loading}
      />
    </div>
  )
}

export default App
