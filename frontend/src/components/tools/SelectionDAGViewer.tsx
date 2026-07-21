import { useState, useEffect } from 'react'
import { GraphCanvas, NodeDetailsPanel, layoutDag } from '../graph'

interface SelectionDAGViewerProps {
  nodes: any[]
  edges: any[]
  stage?: string
}

/**
 * SelectionDAG visualization tool
 * Orchestrates graph layout, rendering, and interaction
 */
export function SelectionDAGViewer({ nodes, edges, stage = 'isel' }: SelectionDAGViewerProps) {
  const [layoutedNodes, setLayoutedNodes] = useState<any[]>([])
  const [layoutedEdges, setLayoutedEdges] = useState<any[]>([])
  const [allNodes, setAllNodes] = useState<any[]>([])
  const [allEdges, setAllEdges] = useState<any[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [overlayPosition, setOverlayPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [activeTab, setActiveTab] = useState<'all' | 'isd' | 'amdgpu' | 'regs' | null>(null)

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

  // Calculate graph statistics
  const calculateStats = () => {
    if (nodes.length === 0) return null

    // Count AMDGPU-specific vs generic ISD nodes
    let amdgpuCount = 0
    let isdCount = 0
    const physicalRegs = new Set<string>()
    const virtualRegs = new Set<string>()

    nodes.forEach(node => {
      const opcode = node.data?.opcode || node.data?.label || ''

      // Check if AMDGPU-specific
      if (opcode.includes('AMDGPUISD') || opcode.includes('AMDGPU') || opcode.startsWith('SI_') || opcode.startsWith('V_')) {
        amdgpuCount++
      } else {
        isdCount++
      }

      // Extract registers from node data
      const nodeText = JSON.stringify(node.data)

      // Physical registers: $vgpr, $sgpr, $v, $s
      const physMatches = nodeText.match(/\$[vs]gpr\d+|\$[vs]\d+/g)
      if (physMatches) {
        physMatches.forEach(reg => physicalRegs.add(reg))
      }

      // Virtual registers: %name or %number
      const virtMatches = nodeText.match(/%[a-zA-Z_]\w*|%\d+/g)
      if (virtMatches) {
        virtMatches.forEach(reg => virtualRegs.add(reg))
      }
    })

    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      amdgpuCount,
      isdCount,
      physicalCount: physicalRegs.size,
      virtualCount: virtualRegs.size
    }
  }

  const stats = calculateStats()

  // Get nodes for each category (only operation nodes, not metadata)
  const getNodesByCategory = (category: 'isd' | 'amdgpu' | 'regs') => {
    return nodes.filter(node => {
      const opcode = node.data?.opcode || node.data?.label || ''

      // Skip non-operation nodes (Register, Constant, EntryToken, etc.)
      if (!opcode || opcode.startsWith('Register') || opcode.startsWith('Constant') ||
          opcode === 'EntryToken' || opcode.includes('\\<')) {
        return false
      }

      if (category === 'isd') {
        // Generic ISD operations
        return !opcode.includes('AMDGPUISD') && !opcode.includes('AMDGPU') &&
               !opcode.startsWith('SI_') && !opcode.startsWith('V_')
      } else if (category === 'amdgpu') {
        // AMDGPU-specific operations
        return opcode.includes('AMDGPUISD') || opcode.includes('AMDGPU') ||
               opcode.startsWith('SI_') || opcode.startsWith('V_')
      } else if (category === 'regs') {
        // Register operations only
        return opcode.includes('CopyFromReg') || opcode.includes('CopyToReg') ||
               opcode.includes('COPY')
      }
      return false
    })
  }

  // Extract register list from nodes
  const getRegisterList = () => {
    const physicalRegs = new Set<string>()
    const virtualRegs = new Set<string>()

    nodes.forEach(node => {
      const nodeText = JSON.stringify(node.data)

      // Physical registers: $vgpr, $sgpr
      const physMatches = nodeText.match(/\$[vs]gpr\d+|\$[vs]\d+/g)
      if (physMatches) {
        physMatches.forEach(reg => physicalRegs.add(reg))
      }

      // Virtual registers: %name or %number
      const virtMatches = nodeText.match(/%[a-zA-Z_]\w*|%\d+/g)
      if (virtMatches) {
        virtMatches.forEach(reg => virtualRegs.add(reg))
      }
    })

    return {
      physical: Array.from(physicalRegs).sort(),
      virtual: Array.from(virtualRegs).sort()
    }
  }

  return (
    <div style={{ height: '100%', width: '100%', backgroundColor: '#0a0a0a', position: 'relative' }}>
      {/* Floating Info Tabs - Top Left */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
        <div
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(24, 160, 24, 0.3)',
            borderRadius: '3px',
            padding: '2px 4px',
            display: 'flex',
            gap: '4px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px'
          }}
        >
          {(['all', 'isd', 'amdgpu', 'regs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(activeTab === tab ? null : tab)}
              style={{
                background: activeTab === tab ? 'rgba(24, 160, 24, 0.2)' : 'transparent',
                color: activeTab === tab ? '#18a018' : '#909090',
                border: activeTab === tab ? '1px solid #18a018' : '1px solid transparent',
                borderRadius: '2px',
                padding: '3px 6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                fontWeight: activeTab === tab ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.color = '#c8c8c8'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  e.currentTarget.style.color = '#909090'
                }
              }}
            >
              {tab === 'all' ? 'All' :
               tab === 'isd' ? 'ISD' :
               tab === 'amdgpu' ? 'AMD' : 'Reg'}
            </button>
          ))}
        </div>

        {/* Info Panel (drops down when tab is clicked) */}
        {activeTab && activeTab !== 'all' && (
          <div
            style={{
              marginTop: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              border: '1px solid rgba(24, 160, 24, 0.4)',
              borderRadius: '3px',
              padding: '6px 8px',
              maxWidth: '300px',
              maxHeight: '400px',
              overflowY: 'auto',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              lineHeight: '1.4',
              color: '#c8c8c8'
            }}
          >
            {activeTab === 'isd' && (() => {
              const opcodes = Array.from(new Set(
                getNodesByCategory('isd').map(node => node.data?.opcode || node.data?.label || node.id)
              )).sort()
              return (
                <div>
                  <div style={{ color: '#18a018', fontWeight: 'bold', marginBottom: '4px' }}>
                    ISD Operations ({opcodes.length})
                  </div>
                  {opcodes.map((opcode, idx) => (
                    <div key={idx} style={{ padding: '2px 0', borderBottom: '1px solid #1a1a1a' }}>
                      {opcode}
                    </div>
                  ))}
                </div>
              )
            })()}
            {activeTab === 'amdgpu' && (() => {
              const opcodes = Array.from(new Set(
                getNodesByCategory('amdgpu').map(node => node.data?.opcode || node.data?.label || node.id)
              )).sort()
              return (
                <div>
                  <div style={{ color: '#18a018', fontWeight: 'bold', marginBottom: '4px' }}>
                    AMDGPU Operations ({opcodes.length})
                  </div>
                  {opcodes.map((opcode, idx) => (
                    <div key={idx} style={{ padding: '2px 0', borderBottom: '1px solid #1a1a1a' }}>
                      {opcode}
                    </div>
                  ))}
                </div>
              )
            })()}
            {activeTab === 'regs' && (() => {
              const regs = getRegisterList()
              return (
                <div>
                  <div style={{ color: '#18a018', fontWeight: 'bold', marginBottom: '4px' }}>
                    Physical Registers ({regs.physical.length})
                  </div>
                  {regs.physical.map((reg, idx) => (
                    <div key={idx} style={{ padding: '2px 0', borderBottom: '1px solid #1a1a1a' }}>
                      {reg}
                    </div>
                  ))}
                  <div style={{ color: '#18a018', fontWeight: 'bold', marginTop: '8px', marginBottom: '4px' }}>
                    Virtual Registers ({regs.virtual.length})
                  </div>
                  {regs.virtual.map((reg, idx) => (
                    <div key={idx} style={{ padding: '2px 0', borderBottom: '1px solid #1a1a1a' }}>
                      {reg}
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}
      </div>

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

      {/* Floating Graph Stats Overlay - Bottom Right */}
      {stats && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(24, 160, 24, 0.3)',
            borderRadius: '4px',
            padding: '10px 14px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#c8c8c8',
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          <div style={{ color: '#18a018', fontWeight: 'bold', marginBottom: '5px' }}>
            {stage}
          </div>
          <div>
            {stats.nodeCount} nodes, {stats.edgeCount} edges
          </div>
          <div>
            {stats.amdgpuCount} AMDGPU, {stats.isdCount} ISD
          </div>
          <div>
            vgpr: {stats.physicalCount} | virt: {stats.virtualCount}
          </div>
        </div>
      )}
    </div>
  )
}
