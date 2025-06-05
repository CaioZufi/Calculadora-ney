import React from "react";
import { cn } from "@/lib/utils";
import { DecimalInput } from "./decimal-input";

interface InputWithAffixProps {
  prefix?: string;
  suffix?: string;
  value: string | number | undefined;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  step?: string;
  min?: string;
  max?: string;
  className?: string;
  disabled?: boolean;
  showThousandSeparator?: boolean;
  isMonetary?: boolean;
  autoFocus?: boolean;
}

export function InputWithAffix({
  prefix,
  suffix,
  value,
  onValueChange,
  placeholder,
  step = "0.01",
  min,
  max,
  className,
  disabled = false,
  showThousandSeparator = true,
  isMonetary = false,
  autoFocus = false,
}: InputWithAffixProps) {
  return (
    <div className="w-full max-w-xs"> {/* Tamanho consistente para todos os campos */}
      <div className="relative">
        {/* Container para prefixo, campo de entrada e sufixo */}
        <div className="flex rounded-md border border-input bg-background overflow-hidden">
          {/* Prefixo */}
          {prefix && (
            <div className="flex items-center pl-2 py-2 bg-gray-50 text-sm text-muted-foreground border-r border-gray-100">
              {prefix}
            </div>
          )}
          
          {/* Campo de entrada */}
          <DecimalInput
            value={value}
            onValueChange={onValueChange}
            placeholder={placeholder}
            step={step}
            min={min}
            max={max}
            disabled={disabled}
            showThousandSeparator={showThousandSeparator}
            isMonetary={isMonetary}
            autoFocus={autoFocus}
            className={cn(
              "flex-1 border-0 bg-transparent px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          />
          
          {/* Sufixo dentro do campo para não ocupar espaço do input */}
          {suffix && (
            <div className="flex items-center px-2 bg-gray-50 text-sm text-muted-foreground border-l border-gray-100">
              {suffix}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}