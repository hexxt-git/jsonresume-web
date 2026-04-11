import { useState, lazy, Suspense } from 'react';
import { Magicpen, DocumentText1, Layer, ShieldTick } from 'iconsax-react';

const JobTailoringTool = lazy(() => import('./JobTailoring/JobTailoringTool'));
const ApplicationHelpTool = lazy(() => import('./ApplicationHelp/ApplicationHelpTool'));
const BatchTailoringTool = lazy(() => import('./BatchTailoring/BatchTailoringTool'));
const ResumeAuditTool = lazy(() => import('./ResumeAudit/ResumeAuditTool'));

const TOOLS = [
  {
    id: 'job-tailoring',
    title: 'Job Tailoring',
    description: 'Tailor your resume for a specific job posting',
    icon: Magicpen,
  },
  {
    id: 'application-help',
    title: 'Application Help',
    description: 'Cover letters, application questions, and follow-up emails',
    icon: DocumentText1,
  },
  {
    id: 'batch-tailoring',
    title: 'Batch Tailoring',
    description: 'Tailor for multiple jobs at once',
    icon: Layer,
  },
  {
    id: 'resume-audit',
    title: 'General ATS Audit',
    description: 'ATS compatibility score and improvement suggestions',
    icon: ShieldTick,
  },
] as const;

const TOOL_COMPONENTS: Record<string, typeof JobTailoringTool> = {
  'job-tailoring': JobTailoringTool,
  'application-help': ApplicationHelpTool,
  'batch-tailoring': BatchTailoringTool,
  'resume-audit': ResumeAuditTool,
};

const Fallback = (
  <div className="h-full flex items-center justify-center text-xs text-text-tertiary">
    Loading...
  </div>
);

export default function AutomationHub() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  if (activeTool) {
    const ToolComponent = TOOL_COMPONENTS[activeTool];
    return (
      <Suspense fallback={Fallback}>
        <ToolComponent onBack={() => setActiveTool(null)} />
      </Suspense>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-sm font-semibold text-text">Automation Tools</h2>
          <p className="text-xs text-text-muted mt-1">AI-powered tools to enhance your resume</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="flex items-start gap-3 p-4 border border-border rounded-lg bg-bg hover:bg-bg-hover hover:border-accent/30 cursor-pointer transition-colors text-left"
              >
                <Icon
                  size={20}
                  variant="Bold"
                  color="currentColor"
                  className="text-accent shrink-0 mt-0.5"
                />
                <div>
                  <div className="text-xs font-medium text-text">{tool.title}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{tool.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
