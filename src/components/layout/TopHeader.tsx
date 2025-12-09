import { ChevronLeft, Circle, Play, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopHeaderProps {
  processName: string;
  isUnsaved?: boolean;
}

export const TopHeader = ({ processName, isUnsaved = true }: TopHeaderProps) => {
  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Left - Breadcrumb */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground step-transition">
          <ChevronLeft className="w-4 h-4" />
          <span>Processes</span>
        </button>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium text-foreground">{processName}</span>
        {isUnsaved && (
          <Badge 
            variant="secondary" 
            className="text-xs font-normal text-muted-foreground bg-muted/60 border-0"
          >
            <Circle className="w-1.5 h-1.5 mr-1.5 fill-amber-500 text-amber-500" />
            Unsaved
          </Badge>
        )}
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark Reviewed
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          className="border-border"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button 
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          <Play className="w-4 h-4 mr-2" />
          Run Process
        </Button>
      </div>
    </header>
  );
};
