import { useState } from 'react'

interface InputPanelProps {
  onCompile: (irCode: string, stage: string) => void
}

export function InputPanel({ onCompile }: InputPanelProps) {
  const [irCode, setIrCode] = useState('')
  const [stage, setStage] = useState('isel')

  const handleCompile = () => {
    if (irCode.trim()) {
      onCompile(irCode, stage)
    }
  }

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2>Input</h2>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          DAG Stage:
        </label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        >
          <option value="dag-combine1">dag-combine1 (after build, before optimization)</option>
          <option value="legalize">legalize (before legalization)</option>
          <option value="dag-combine2">dag-combine2 (before 2nd optimization)</option>
          <option value="isel">isel (before instruction selection)</option>
          <option value="sched">sched (before scheduling)</option>
        </select>
      </div>

      <textarea
        value={irCode}
        onChange={(e) => setIrCode(e.target.value)}
        placeholder="Paste LLVM IR here..."
        style={{
          flex: 1,
          fontFamily: 'monospace',
          fontSize: '14px',
          padding: '10px',
          marginBottom: '10px',
          resize: 'none'
        }}
      />

      <button
        onClick={handleCompile}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          backgroundColor: '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '4px'
        }}
      >
        ▶️ Compile & View DAG
      </button>
    </div>
  )
}
