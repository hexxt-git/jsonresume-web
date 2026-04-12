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
    desc: 'Analyze keywords, score match, and rewrite sections to fit a specific job description.',
    icon: Magicpen,
  },
  {
    id: 'application-help',
    title: 'Application Help',
    desc: 'Generate cover letters, answer application questions, and draft follow-up emails.',
    icon: DocumentText1,
  },
  {
    id: 'batch-tailoring',
    title: 'Batch Tailoring',
    desc: 'Paste multiple job descriptions and get a tailored resume for each, ready to download.',
    icon: Layer,
  },
  {
    id: 'resume-audit',
    title: 'General ATS Audit',
    desc: 'Score your resume for ATS compatibility, weak verbs, missing keywords, and more.',
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
    <div className="h-full flex flex-col p-3 space-y-2">
      <h2 className="text-sm font-semibold text-text">Automation</h2>
      <div className="grid grid-cols-2 gap-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="flex items-start gap-3 p-4 pb-24 rounded-lg bg-bg-secondary cursor-pointer active:opacity-80 text-left"
            >
              <Icon
                size={20}
                variant="Bold"
                color="currentColor"
                className="text-text-muted shrink-0 mt-0.5"
              />
              <div>
                <div className="text-sm font-medium text-text">{tool.title}</div>
                <div className="text-xs text-text-muted mt-0.5">{tool.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
