import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', zIndex: 100 }}>
      {/* Curved Pill Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--input-bg)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text-primary)',
          borderRadius: '20px',
          padding: '8px 16px',
          fontSize: '0.85rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.25)' : 'none',
          borderColor: isOpen ? 'var(--accent-primary)' : 'var(--glass-border)',
        }}
      >
        <span>{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown
          size={14}
          color="#818cf8"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
          }}
        />
      </button>

      {/* Solid Opaque Dropdown Popup Menu Box */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '200px',
            padding: '6px',
            borderRadius: '16px',
            zIndex: 9999,
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
            border: '1px solid var(--glass-border-hover)',
            // 100% Opaque Solid Background depending on theme
            background: 'var(--card-inner-bg-solid, #0f172a)',
            opacity: 1,
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '9px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? '700' : '500',
                  color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  background: isSelected ? 'var(--accent-gradient)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  marginBottom: '2px',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.25)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} color="#ffffff" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
