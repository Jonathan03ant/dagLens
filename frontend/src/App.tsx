import { useState, useEffect, useRef } from 'react'
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

  // Settings - dynamic arch/CPU
  const [llcPath, setLlcPath] = useState('/path/to/llc')
  const [architectures, setArchitectures] = useState<Array<{name: string, description: string}>>([])
  const [cpus, setCpus] = useState<Array<{name: string, description: string}>>([])
  const [arch, setArch] = useState('amdgcn')
  const [cpu, setCpu] = useState('gfx1101')
  const [loadingTargets, setLoadingTargets] = useState(false)

  // Resizable panel state
  const [leftPanelWidth, setLeftPanelWidth] = useState(40)
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const deltaX = e.clientX - startXRef.current
      const containerWidth = window.innerWidth
      const deltaPercent = (deltaX / containerWidth) * 100
      const newWidth = Math.max(20, Math.min(80, startWidthRef.current + deltaPercent))
      setLeftPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = leftPanelWidth
  }

  // Fetch architectures when llc path changes
  const fetchArchitectures = async (path: string) => {
    if (!path || path === '/path/to/llc') return

    setLoadingTargets(true)
    try {
      const response = await fetch(`/api/targets?llc_path=${encodeURIComponent(path)}`)
      const data = await response.json()

      if (response.ok && data.architectures) {
        setArchitectures(data.architectures)
        // Set default arch if available
        if (data.architectures.length > 0 && !arch) {
          const defaultArch = data.architectures.find((a: any) => a.name === 'amdgcn') || data.architectures[0]
          setArch(defaultArch.name)
        }
      }
    } catch (error) {
      console.error('Failed to fetch architectures:', error)
    } finally {
      setLoadingTargets(false)
    }
  }

  // Fetch CPUs when arch changes
  const fetchCpus = async (path: string, architecture: string) => {
    if (!path || path === '/path/to/llc' || !architecture) return

    setLoadingTargets(true)
    try {
      const response = await fetch(`/api/targets?llc_path=${encodeURIComponent(path)}&arch=${architecture}`)
      const data = await response.json()

      if (response.ok && data.cpus) {
        setCpus(data.cpus)
        // Set default CPU if available
        if (data.cpus.length > 0 && !cpu) {
          const defaultCpu = data.cpus.find((c: any) => c.name === 'gfx1101') || data.cpus[0]
          setCpu(defaultCpu.name)
        }
      }
    } catch (error) {
      console.error('Failed to fetch CPUs:', error)
    } finally {
      setLoadingTargets(false)
    }
  }

  // Trigger fetch when llc path or arch changes
  useEffect(() => {
    fetchArchitectures(llcPath)
  }, [llcPath])

  useEffect(() => {
    if (arch) {
      fetchCpus(llcPath, arch)
    }
  }, [llcPath, arch])

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

      // Update terminal output (from both success and error responses)
      if (data.terminal_output) {
        setTerminalOutput(data.terminal_output)
      }

      // Only update graph if successful
      if (response.ok) {
        setNodes(data.nodes || [])
        setEdges(data.edges || [])
      }
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
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', backgroundColor: '#000000', position: 'relative' }}>
        {/* Left Panel - Input */}
        <div style={{
          width: `${leftPanelWidth}%`,
          backgroundColor: '#0a0a0a',
          overflow: 'auto',
          position: 'relative'
        }}>
          <InputPanel
            value={irCode}
            onChange={setIrCode}
            terminalOutput={terminalOutput}
            isRunning={loading}
          />

          {/* Resize Handle */}
          <div
            onMouseDown={handleResizeStart}
            className="group"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '4px',
              height: '100%',
              cursor: 'ew-resize',
              zIndex: 1000
            }}
          >
            <div className="w-0.5 h-full bg-transparent group-hover:bg-[#18a018] transition-colors ml-[1.75px]" />
          </div>
        </div>

        {/* Right Panel - Graph */}
        <div style={{ width: `${100 - leftPanelWidth}%`, position: 'relative', backgroundColor: '#0a0a0a' }}>
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
          <SelectionDAGViewer nodes={nodes} edges={edges} stage={stage} />
        </div>
      </div>

      {/* Footer */}
      <Footer
        llcPath={llcPath}
        onLlcPathChange={setLlcPath}
        architectures={architectures}
        arch={arch}
        onArchChange={setArch}
        cpus={cpus}
        cpu={cpu}
        onCpuChange={setCpu}
        stage={stage}
        onStageChange={setStage}
        onRun={handleRun}
        isLoading={loading || loadingTargets}
      />
    </div>
  )
}

export default App
