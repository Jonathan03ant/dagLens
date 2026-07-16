import { useState, useRef, useEffect } from 'react'

interface CustomSelectProps {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function CustomSelect({ value, options, onChange, disabled }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div ref={selectRef} className="relative">
      {/* Select button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="bg-[#000000] text-[#18a018] border border-[#1a1a1a] px-2 py-0.5 rounded text-xs hover:text-[#c8c8c8] transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
        style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <span className="text-[9px]">▼</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded shadow-lg z-50">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="px-2 py-1 text-[#18a018] hover:text-[#c8c8c8] hover:bg-[#0a0a0a] cursor-pointer transition-colors whitespace-nowrap"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
