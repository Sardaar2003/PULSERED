import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({
  options = [],
  value,
  onChange,
  label,
  align = 'left',
  fullWidth = false,
  triggerStyle = {},
  popupStyle = {},
}) => {
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
    <div style={{ position: 'relative', display: fullWidth ? 'block' : 'inline-block', width: fullWidth ? '100%' : 'auto' }}>
      {/* Curved Pill Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleOpen}
        style={{
          background: 'var(--input-bg)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text-primary)',
          borderRadius: '24px',
          padding: fullWidth ? '11px 20px' : '9px 18px',
          fontSize: '0.86rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: fullWidth ? 'space-between' : 'flex-start',
          width: fullWidth ? '100%' : 'auto',
          gap: '10px',
          transition: 'all 0.22s ease',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(99, 102, 241, 0.22), 0 4px 14px rgba(99, 102, 241, 0.12)'
            : '0 2px 8px rgba(0, 0, 0, 0.04)',
          borderColor: isOpen ? 'var(--accent-primary)' : 'var(--glass-border)',
          whiteSpace: 'nowrap',
          ...triggerStyle,
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = 'var(--glass-border)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '600', flexShrink: 0 }}>
              {label}
            </span>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', fontWeight: '700' }}>
            {selectedOption ? selectedOption.label : value}
          </span>
        </div>
        <ChevronDown
          size={15}
          color="var(--accent-primary)"
          style={{
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </button>

      {/* Solid Curved Dropdown Popup Menu Box rendered via Portal */}
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
              minWidth: fullWidth ? `${Math.max(coords.width, 220)}px` : '190px',
              width: fullWidth ? `${coords.width}px` : 'max-content',
              maxWidth: fullWidth ? '100vw' : '380px',
              padding: '8px',
              borderRadius: '22px',
              zIndex: 9999999,
              boxShadow: 'var(--dropdown-shadow)',
              border: '1px solid var(--glass-border-hover)',
              background: 'var(--card-inner-bg-solid, #ffffff)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              opacity: 1,
              animation: 'fadeIn 0.15s ease',
              ...popupStyle,
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
                    padding: '10px 16px',
                    borderRadius: '16px',
                    fontSize: '0.84rem',
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#ffffff' : 'var(--text-primary)',
                    background: isSelected ? 'var(--accent-gradient)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                    marginBottom: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--dropdown-item-hover)';
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ lineHeight: 1.35, fontWeight: isSelected ? '700' : '600' }}>{option.label}</span>
                      {option.badge && (
                        <span
                          style={{
                            fontSize: '0.64rem',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                            color: isSelected ? '#ffffff' : 'var(--accent-primary)',
                            fontWeight: '700',
                          }}
                        >
                          {option.badge}
                        </span>
                      )}
                    </div>
                    {option.description && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: isSelected ? 'rgba(255, 255, 255, 0.88)' : 'var(--text-secondary)',
                          lineHeight: 1.35,
                        }}
                      >
                        {option.description}
                      </span>
                    )}
                  </div>
                  {isSelected && <Check size={16} color="#ffffff" style={{ flexShrink: 0, marginLeft: '8px' }} />}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};
