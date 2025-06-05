import React, { forwardRef, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { ensureDotDecimal } from "@/lib/utils";

interface DecimalInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: number | undefined) => void;
  showThousandSeparator?: boolean;
  isMonetary?: boolean; // Para valores monetários com 2 casas decimais
}

const DecimalInput = forwardRef<HTMLInputElement, DecimalInputProps>(
  ({ value, onChange, onValueChange, showThousandSeparator = true, isMonetary = false, ...props }, ref) => {
    // Garantir que o valor inicial seja uma string
    const [internalValue, setInternalValue] = useState(
      value !== undefined ? String(value) : ""
    );
    
    // Estado para o valor formatado para exibição
    const [displayValue, setDisplayValue] = useState("");
    
    // Referências
    const cursorPositionRef = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const isEditingRef = useRef(false);
    
    // Função para formatar números no formato brasileiro (10.000,00)
    const formatToBrazilianDisplay = (value: string) => {
      if (!value) return "";
      if (isEditingRef.current) return value.replace('.', ',');
      
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return value;
      
      if (showThousandSeparator) {
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: isMonetary ? 2 : 0,
          maximumFractionDigits: isMonetary ? 2 : 20,
        }).format(numValue);
      }
      
      return value.replace('.', ',');
    };
    
    // Inicializar o valor formatado
    useEffect(() => {
      if (internalValue) {
        setDisplayValue(formatToBrazilianDisplay(internalValue));
      }
    }, []);
    
    // Atualizar o valor quando a prop value mudar
    useEffect(() => {
      if (value !== undefined && String(value) !== internalValue) {
        setInternalValue(String(value));
        if (!isEditingRef.current) {
          setDisplayValue(formatToBrazilianDisplay(String(value)));
        }
      }
    }, [value, showThousandSeparator]);
    
    // Combinar a ref externa com a ref interna
    const handleRefs = (instance: HTMLInputElement | null) => {
      inputRef.current = instance;
      if (typeof ref === "function") {
        ref(instance);
      } else if (ref) {
        ref.current = instance;
      }
    };
    
    // Restaurar posição do cursor após atualizações
    useEffect(() => {
      if (cursorPositionRef.current !== null && inputRef.current) {
        inputRef.current.setSelectionRange(
          cursorPositionRef.current,
          cursorPositionRef.current
        );
        cursorPositionRef.current = null;
      }
    }, [displayValue]);
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      isEditingRef.current = true;
      
      // Ao ganhar foco, mostrar valor com vírgula como decimal, sem formatação
      setDisplayValue(internalValue.replace('.', ','));
      
      if (props.onFocus) {
        props.onFocus(e);
      }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      isEditingRef.current = false;
      
      // Se for monetário, garantir 2 casas decimais (no valor interno)
      if (isMonetary && internalValue) {
        const numValue = parseFloat(internalValue);
        if (!isNaN(numValue)) {
          const formattedValue = numValue.toFixed(2);
          setInternalValue(formattedValue);
          
          // Notificar a mudança do valor
          if (onValueChange) {
            onValueChange(parseFloat(formattedValue));
          }
        }
      }
      
      // Ao perder foco, formatar o valor para exibição
      setDisplayValue(formatToBrazilianDisplay(internalValue));
      
      if (props.onBlur) {
        props.onBlur(e);
      }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Salvar posição do cursor
      if (inputRef.current) {
        cursorPositionRef.current = inputRef.current.selectionStart;
      }
      
      // Valor digitado pelo usuário (pode conter vírgulas)
      const userValue = e.target.value;
      
      // Converter vírgulas para pontos (para armazenamento interno)
      const cleanedValue = ensureDotDecimal(userValue);
      
      // Atualizar estados
      setInternalValue(cleanedValue);
      setDisplayValue(userValue); // Manter o que o usuário digitou durante a edição
      
      // Criar evento sintético com o valor convertido (com ponto decimal)
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: cleanedValue
        }
      };
      
      // Chamar handlers
      if (onChange) {
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      }
      
      if (onValueChange) {
        const numericValue = cleanedValue === "" ? undefined : parseFloat(cleanedValue);
        onValueChange(numericValue);
      }
    };
    
    // Manipular tecla Enter para evitar envio automático do formulário quando pressionada em um campo
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Prevenir o comportamento padrão da tecla Enter (que aciona o submit do formulário)
      if (e.key === 'Enter') {
        e.preventDefault();
        
        // Focar no próximo elemento do formulário
        if (e.currentTarget.form) {
          const form = e.currentTarget.form;
          const formElements = Array.from(form.elements);
          const index = formElements.indexOf(e.currentTarget);
          const isLastInput = formElements
            .slice(index + 1)
            .filter(e => 
              (e as HTMLElement).tagName === 'INPUT' ||
              (e as HTMLElement).tagName === 'SELECT' ||
              (e as HTMLElement).tagName === 'TEXTAREA'
            ).length === 0;
            
          // Se for o último campo de entrada, procurar pelo botão "Próximo"
          if (isLastInput) {
            // Procurar botão que contem o texto "Próximo" ou do tipo "submit"
            const nextButton = formElements.find(el => {
              const element = el as HTMLElement;
              if (element.tagName === 'BUTTON') {
                const buttonText = element.textContent?.trim().toLowerCase();
                return (
                  buttonText === 'próximo' || 
                  buttonText === 'calcular economia' ||
                  (element as HTMLButtonElement).type === 'submit'
                );
              }
              return false;
            }) as HTMLElement;
            
            if (nextButton) {
              nextButton.focus();
            }
          } else {
            // Se não for o último campo, foca no próximo campo normalmente
            const nextElement = formElements[index + 1] as HTMLElement;
            if (nextElement) {
              nextElement.focus();
            }
          }
        }
      }
      
      // Chamar o handler original se existir
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };
    
    return (
      <Input
        {...props}
        ref={handleRefs}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        inputMode="decimal"
        type="text"
      />
    );
  }
);

DecimalInput.displayName = "DecimalInput";

export { DecimalInput };