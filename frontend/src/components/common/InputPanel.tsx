import { CodeEditor } from './CodeEditor'
import { TerminalOutput } from './TerminalOutput'
import type { TerminalLine } from './TerminalOutput'

interface InputPanelProps {
  value: string
  onChange: (value: string) => void
  terminalOutput: TerminalLine[]
  isRunning: boolean
}

export function InputPanel({ value, onChange, terminalOutput, isRunning }: InputPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <CodeEditor value={value} onChange={onChange} />
      </div>
      <TerminalOutput output={terminalOutput} isRunning={isRunning} />
    </div>
  )
}
