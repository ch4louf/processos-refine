import React, { useState, useRef, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import { User, Users, Briefcase } from 'lucide-react';

export interface MentionSuggestion {
  id: string;
  label: string;
  type: 'user' | 'team' | 'jobTitle';
  subLabel?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionSelect: (mention: MentionSuggestion) => void;
  suggestions: MentionSuggestion[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  autoFocus?: boolean;
  bold?: boolean;
}

export interface MentionInputHandle {
  focus: () => void;
  setSelectionRange: (start: number, end: number) => void;
  getTextarea: () => HTMLTextAreaElement | null;
}

const MentionInput = forwardRef<MentionInputHandle, MentionInputProps>(({
  value,
  onChange,
  onMentionSelect,
  suggestions,
  placeholder,
  className = '',
  disabled = false,
  onKeyDown,
  onFocus,
  onBlur,
  autoFocus = false,
  bold = false
}, ref) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Expose imperative handle for parent components
  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    setSelectionRange: (start: number, end: number) => textareaRef.current?.setSelectionRange(start, end),
    getTextarea: () => textareaRef.current
  }));

  // Filter suggestions based on query
  const filteredSuggestions = useMemo(() => {
    if (!mentionQuery) return suggestions.slice(0, 8);
    const q = mentionQuery.toLowerCase();
    return suggestions
      .filter(s => s.label.toLowerCase().includes(q) || s.subLabel?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [suggestions, mentionQuery]);

  // Reset selected index when filtered suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredSuggestions.length, mentionQuery]);

  // Calculate dropdown position based on cursor
  const updateDropdownPosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStartIndex === null) return;

    const textareaRect = textarea.getBoundingClientRect();
    
    // Simple positioning below the textarea
    setDropdownPosition({
      top: textarea.offsetHeight + 4,
      left: 0
    });
  }, [mentionStartIndex]);

  useEffect(() => {
    if (showSuggestions) {
      updateDropdownPosition();
    }
  }, [showSuggestions, updateDropdownPosition]);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '0px';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Handle input change - detect @ mentions
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);

    // Find if we're in a mention context
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textBetween = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's no space after @ (still typing the mention)
      const hasSpaceOrNewline = /[\s\n]/.test(textBetween);
      // Check if @ is at start or preceded by space/newline
      const charBefore = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' ';
      const isValidMentionStart = /[\s\n]/.test(charBefore) || lastAtIndex === 0;
      
      if (!hasSpaceOrNewline && isValidMentionStart) {
        setShowSuggestions(true);
        setMentionQuery(textBetween);
        setMentionStartIndex(lastAtIndex);
        return;
      }
    }
    
    setShowSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(null);
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDownInternal = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectSuggestion(filteredSuggestions[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }
    
    // Pass through to parent handler
    onKeyDown?.(e);
  };

  // Select a suggestion
  const selectSuggestion = (suggestion: MentionSuggestion) => {
    if (mentionStartIndex === null) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(textarea.selectionStart);
    
    // Format the mention text
    const mentionText = `@${suggestion.label} `;
    const newValue = beforeMention + mentionText + afterMention;
    
    onChange(newValue);
    onMentionSelect(suggestion);
    
    // Reset mention state
    setShowSuggestions(false);
    setMentionQuery('');
    setMentionStartIndex(null);
    
    // Set cursor position after mention
    const newCursorPos = mentionStartIndex + mentionText.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && 
          textareaRef.current && !textareaRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeIcon = (type: MentionSuggestion['type']) => {
    switch (type) {
      case 'user': return User;
      case 'team': return Users;
      case 'jobTitle': return Briefcase;
    }
  };

  const getTypeColor = (type: MentionSuggestion['type']) => {
    switch (type) {
      case 'user': return 'text-blue-600 bg-blue-50';
      case 'team': return 'text-fuchsia-600 bg-fuchsia-50';
      case 'jobTitle': return 'text-indigo-600 bg-indigo-50';
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDownInternal}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={1}
      />
      
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-[200] w-64 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Type @ to mention
            </span>
          </div>
          <div className="max-h-64 overflow-auto">
            {filteredSuggestions.map((suggestion, index) => {
              const Icon = getTypeIcon(suggestion.type);
              const colorClass = getTypeColor(suggestion.type);
              return (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors ${
                    index === selectedIndex ? 'bg-indigo-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${colorClass}`}>
                    <Icon size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">
                      {suggestion.label}
                    </div>
                    {suggestion.subLabel && (
                      <div className="text-[10px] text-slate-400 truncate">
                        {suggestion.subLabel}
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${colorClass}`}>
                    {suggestion.type === 'jobTitle' ? 'Job' : suggestion.type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

MentionInput.displayName = 'MentionInput';

export default MentionInput;
