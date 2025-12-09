import { CheckSquare, Paperclip, Settings, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepHoverActionsProps {
  visible: boolean;
}

export const StepHoverActions = ({ visible }: StepHoverActionsProps) => {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 step-transition",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <button
        className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground step-transition"
        title="Add Checkbox"
      >
        <CheckSquare className="w-3.5 h-3.5" />
      </button>
      <button
        className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground step-transition"
        title="Attach File"
      >
        <Paperclip className="w-3.5 h-3.5" />
      </button>
      <button
        className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground step-transition"
        title="Settings"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export const StepDragHandle = ({ visible }: { visible: boolean }) => {
  return (
    <div
      className={cn(
        "cursor-grab step-transition",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground/50" />
    </div>
  );
};
