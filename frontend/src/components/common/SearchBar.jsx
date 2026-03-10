import { useState, useRef } from 'react'

export default function SearchBar({ value, onChange, placeholder = 'Search…', onClear }) {
  const inputRef = useRef(null)

  return (
    <div className="input-icon-wrap">
      <span className="input-icon-left">
        <SearchIcon />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input-icon-l pr-10"
      />
      {value && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-canteen-muted hover:text-secondary transition-colors"
          onClick={() => { onChange(''); onClear?.(); inputRef.current?.focus() }}
          aria-label="Clear search"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
