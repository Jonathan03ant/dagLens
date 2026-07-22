import { useState, useRef, useEffect } from 'react'

interface CustomSelectProps {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function CustomSelect({ value, options, onChange, disabled }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(opt => opt.value === value)
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
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
        <div className="absolute bottom-full left-0 mb-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded shadow-lg z-50" style={{ minWidth: '120px', maxWidth: '200px' }}>
          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full px-2 py-1 bg-[#000000] text-[#18a018] border-b border-[#1a1a1a] focus:outline-none"
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Options list */}
          <div className="overflow-y-auto" style={{ maxHeight: '350px' }}>
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-0.5 text-[#606060] text-left" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                No matches
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className="px-2 py-0.5 text-[#18a018] hover:text-[#c8c8c8] hover:bg-[#111111] cursor-pointer transition-colors text-left"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
