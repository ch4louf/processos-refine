import { ReactNode } from "react";

interface WorkspaceCanvasProps {
  children: ReactNode;
}

export const WorkspaceCanvas = ({ children }: WorkspaceCanvasProps) => {
  return (
    <div className="flex-1 bg-background overflow-auto">
      <div className="min-h-full py-12 px-8 flex justify-center">
        <div className="w-full max-w-3xl">
          {children}
        </div>
      </div>
    </div>
  );
};
