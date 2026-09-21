import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({ options, value, onChange, align = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, right: 0, width: 0 });
  const buttonRef = useRef(null);
  const popupRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 6,
        left: rect.left,
        right: window.innerWidth - rect.right,
        width: rect.width,
      });
    }
  }, []);

  const toggleOpen = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        popupRef.current &&
        !popupRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Curved Pill Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
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
          whiteSpace: 'nowrap',
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

      {/* Solid Opaque Dropdown Popup Menu Box rendered via Portal */}
      {isOpen &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              ...(align === 'right'
                ? { right: `${coords.right}px`, left: 'auto' }
                : { left: `${coords.left}px`, right: 'auto' }),
              minWidth: '190px',
              width: 'max-content',
              maxWidth: '280px',
              padding: '6px',
              borderRadius: '16px',
              zIndex: 999999,
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85)',
              border: '1px solid var(--glass-border-hover)',
              background: 'var(--card-inner-bg-solid, #0f172a)',
              opacity: 1,
              animation: 'fadeIn 0.15s ease',
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
                    gap: '12px',
                    transition: 'all 0.15s ease',
                    marginBottom: '2px',
                    whiteSpace: 'nowrap',
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
          </div>,
          document.body
        )}
    </div>
  );
};
