import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Link, List } from "lucide-react";
import { cn } from "@/lib/utils";

const textFormats = [
  { icon: Bold, label: "Bold", active: false },
  { icon: Italic, label: "Italic", active: false },
  { icon: Underline, label: "Underline", active: false },
];

const alignments = [
  { icon: AlignLeft, label: "Left", active: true },
  { icon: AlignCenter, label: "Center", active: false },
  { icon: AlignRight, label: "Right", active: false },
];

const colors = [
  { color: "bg-foreground", label: "Black" },
  { color: "bg-primary", label: "Primary" },
  { color: "bg-emerald-500", label: "Green" },
  { color: "bg-amber-500", label: "Yellow" },
  { color: "bg-rose-500", label: "Red" },
];

export const EditorToolbar = () => {
  return (
    <div className="flex items-center gap-1 p-2 bg-toolbar rounded-xl border border-border/60 shadow-sm">
      {/* Text Formatting */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-border">
        {textFormats.map((format) => (
          <button
            key={format.label}
            className={cn(
              "p-2 rounded-lg step-transition",
              format.active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            title={format.label}
          >
            <format.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1.5 px-2 border-r border-border">
        {colors.map((c) => (
          <button
            key={c.label}
            className={cn(
              "w-5 h-5 rounded-full step-transition ring-offset-2 ring-offset-toolbar hover:ring-2 hover:ring-primary/30",
              c.color
            )}
            title={c.label}
          />
        ))}
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-0.5 px-2 border-r border-border">
        {alignments.map((align) => (
          <button
            key={align.label}
            className={cn(
              "p-2 rounded-lg step-transition",
              align.active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
            title={align.label}
          >
            <align.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Additional Actions */}
      <div className="flex items-center gap-0.5 pl-1">
        <button className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground step-transition" title="Add Link">
          <Link className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground step-transition" title="Bullet List">
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
