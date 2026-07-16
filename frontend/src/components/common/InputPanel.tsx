import { CodeEditor } from './CodeEditor'

interface InputPanelProps {
  value: string
  onChange: (value: string) => void
}

export function InputPanel({ value, onChange }: InputPanelProps) {
  return <CodeEditor value={value} onChange={onChange} />
}
