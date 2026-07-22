import { useRef, useEffect } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
}

export function CodeEditor({ value, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  // Update line numbers when content changes
  useEffect(() => {
    if (lineNumbersRef.current) {
      const lines = value.split('\n').length
      lineNumbersRef.current.innerHTML = Array.from(
        { length: lines },
        (_, i) => `<div class="line-number">${i + 1}</div>`
      ).join('')
    }
  }, [value])

  // Sync scroll between line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  // Handle tab key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#000000]">
      {/* Editor Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #1a1a1a' }}>
        <h2 style={{
          color: '#18a018',
          margin: 0,
          fontSize: '12px',
          fontWeight: '600',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          LLVM IR Input
        </h2>
      </div>

      {/* Code Editor with Line Numbers */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="overflow-hidden select-none"
          style={{
            backgroundColor: '#0a0a0a',
            color: '#505050',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            padding: '20px 6px',
            textAlign: 'right',
            borderRight: '1px solid #1a1a1a',
            minWidth: '32px',
          }}
        >
          <div className="line-number">1</div>
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          placeholder={`Paste or write LLVM IR here...

Example:
define i32 @add(i32 %a, i32 %b) {
  %sum = add i32 %a, %b
  ret i32 %sum
}`}
          spellCheck={false}
          className="flex-1 resize-none focus:outline-none"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '13px',
            lineHeight: '1.6',
            padding: '20px',
            backgroundColor: '#000000',
            color: '#e0e0e0',
            border: 'none',
          }}
        />
      </div>
    </div>
  )
}
