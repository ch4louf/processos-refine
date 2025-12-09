import { useState } from "react";
import { cn } from "@/lib/utils";
import { StepHoverActions, StepDragHandle } from "./StepHoverActions";

interface StepBlockProps {
  number: number;
  content: string;
  placeholder?: string;
}

export const StepBlock = ({ number, content, placeholder = "Describe this step..." }: StepBlockProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={cn(
        "group flex items-start gap-3 py-3 px-2 -mx-2 rounded-lg step-transition",
        (isHovered || isFocused) && "bg-step-hover"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle */}
      <div className="pt-0.5">
        <StepDragHandle visible={isHovered} />
      </div>

      {/* Step Number */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
        <span className="text-xs font-medium text-muted-foreground">{number}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          contentEditable
          suppressContentEditableWarning
          className={cn(
            "text-sm leading-relaxed outline-none",
            content ? "text-foreground" : "text-muted-foreground"
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          {content || placeholder}
        </div>
      </div>

      {/* Hover Actions */}
      <StepHoverActions visible={isHovered || isFocused} />
    </div>
  );
};
