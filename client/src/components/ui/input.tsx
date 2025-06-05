import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onKeyDown, ...props }, ref) => {
    // Handler para prevenir a submissão do formulário quando Enter for pressionado
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
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
