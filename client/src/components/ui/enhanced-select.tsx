import React, { forwardRef, KeyboardEvent, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EnhancedSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  items: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
  name?: string;
  onEnterKeyNavigation?: () => void;
};

export const EnhancedSelect = forwardRef<HTMLButtonElement, EnhancedSelectProps>(
  (
    { 
      value, 
      onValueChange, 
      placeholder, 
      items, 
      className = "", 
      disabled = false, 
      name,
      onEnterKeyNavigation 
    }, 
    ref
  ) => {
    const selectTriggerRef = useRef<HTMLButtonElement>(null);
    
    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      // Se a tecla Enter for pressionada e não houver conteúdo aberto
      if (e.key === "Enter" && !document.querySelector('[data-state="open"]')) {
        e.preventDefault();
        
        // Se a função de navegação foi fornecida, use-a
        if (onEnterKeyNavigation) {
          onEnterKeyNavigation();
        } else {
          // Caso contrário, tente encontrar o próximo elemento focável
          const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
          const elements = Array.from(document.querySelectorAll(focusableElements))
            .filter(el => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1') as HTMLElement[];
          
          const currentIndex = elements.findIndex(el => el === e.currentTarget);
          if (currentIndex > -1 && currentIndex < elements.length - 1) {
            elements[currentIndex + 1].focus();
          }
        }
      }
    };

    return (
      <Select value={value} onValueChange={onValueChange} name={name}>
        <SelectTrigger 
          ref={(el) => {
            // Passa a referência para o componente que está usando
            if (typeof ref === 'function') {
              ref(el);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
            }
            // Mantém a referência internamente também
            selectTriggerRef.current = el;
          }}
          className={className}
          disabled={disabled}
          onKeyDown={handleKeyDown}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

EnhancedSelect.displayName = "EnhancedSelect";