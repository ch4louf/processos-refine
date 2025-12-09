import { Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { WorkspaceCanvas } from "@/components/layout/WorkspaceCanvas";
import { DocumentCard } from "@/components/editor/DocumentCard";
import { StepBlock } from "@/components/editor/StepBlock";
import { Plus } from "lucide-react";

const sampleSteps = [
  { id: 1, content: "Review the incoming request and verify all required information is present" },
  { id: 2, content: "Assign the request to the appropriate team member based on expertise" },
  { id: 3, content: "Complete initial assessment within 24 hours of assignment" },
  { id: 4, content: "Document findings and recommendations in the system" },
  { id: 5, content: "" },
];

const Index = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <TopHeader processName="Customer Onboarding" />

        {/* Workspace */}
        <WorkspaceCanvas>
          <DocumentCard
            title="Customer Onboarding Process"
            description="A streamlined workflow for welcoming new customers and setting them up for success."
          >
            {sampleSteps.map((step, index) => (
              <StepBlock
                key={step.id}
                number={index + 1}
                content={step.content}
              />
            ))}

            {/* Add Step Button */}
            <button className="flex items-center gap-2 py-3 px-2 -mx-2 w-full rounded-lg text-muted-foreground hover:bg-step-hover hover:text-foreground step-transition group">
              <div className="w-4 h-4" /> {/* Spacer for alignment */}
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/30 group-hover:border-primary flex items-center justify-center step-transition">
                <Plus className="w-3 h-3" />
              </div>
              <span className="text-sm">Add new step</span>
            </button>
          </DocumentCard>
        </WorkspaceCanvas>
      </div>
    </div>
  );
};

export default Index;
