import { useState } from 'react'

interface TerminalOutputProps {
  output: TerminalLine[]
  isRunning: boolean
}

export interface TerminalLine {
  type: 'command' | 'stdout' | 'stderr' | 'success' | 'error'
  text: string
  timestamp?: string
}

export function TerminalOutput({ output, isRunning }: TerminalOutputProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="border-t border-[#1a1a1a]">
      {/* Header - Click to toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-[#0a0a0a] px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-[#111111] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#909090] text-xs">
            {isExpanded ? '▼' : '▶'} Terminal Output
          </span>
          {isRunning && (
            <span className="text-[#18a018] text-xs animate-pulse">● Running...</span>
          )}
        </div>
        <span className="text-[#909090] text-xs">
          {output.length} line{output.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Terminal content */}
      {isExpanded && (
        <div
          className="bg-[#000000] px-3 py-2 overflow-y-auto text-left"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            maxHeight: '150px',
            minHeight: '80px',
          }}
        >
          {output.length === 0 ? (
            <div className="text-[#505050] text-xs">No output yet. Click RUN to compile IR.</div>
          ) : (
            output.map((line, idx) => (
              <div
                key={idx}
                className={`${getLineColor(line.type)}`}
                style={{ whiteSpace: 'pre', lineHeight: '1.4' }}
              >
                {line.type === 'command' && '$ '}
                {line.text}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function getLineColor(type: TerminalLine['type']): string {
  switch (type) {
    case 'command':
      return 'text-[#18a018] font-semibold'
    case 'success':
      return 'text-[#18a018]'
    case 'error':
      return 'text-[#ff4444]'
    case 'stderr':
      return 'text-[#ff9944]'
    case 'stdout':
      return 'text-[#c8c8c8]'
    default:
      return 'text-[#909090]'
  }
}
