import { ReactNode } from "react";
import { EditorToolbar } from "./EditorToolbar";

interface DocumentCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export const DocumentCard = ({ title, description, children }: DocumentCardProps) => {
  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div className="mb-6 flex justify-center">
        <EditorToolbar />
      </div>

      {/* Document */}
      <div className="bg-card rounded-2xl border border-border/60 document-shadow">
        <div className="p-10 lg:p-12">
          {/* Title */}
          <div className="mb-8">
            <h1
              contentEditable
              suppressContentEditableWarning
              className="text-2xl lg:text-3xl font-bold text-card-foreground outline-none focus:outline-none leading-tight"
            >
              {title}
            </h1>
            {description !== undefined && (
              <p
                contentEditable
                suppressContentEditableWarning
                className="mt-3 text-muted-foreground outline-none focus:outline-none"
              >
                {description || "Add a description for this process..."}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border/60 mb-8" />

          {/* Content */}
          <div className="space-y-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
