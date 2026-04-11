import { useResumeStore, activeSlot } from '../../store/resumeStore';
import type { ResumeSchema } from '../../types/resume';
import type { ToolCall, ToolDeclaration } from './types';

/* ── Tool declarations (sent to the LLM) ─────────────── */

const ARRAY_SECTIONS = [
  'work',
  'education',
  'skills',
  'projects',
  'languages',
  'volunteer',
  'awards',
  'certificates',
  'publications',
  'interests',
  'references',
] as const;

export const resumeToolDeclarations: ToolDeclaration[] = [
  {
    name: 'update_summary',
    description:
      'Replace the professional summary (basics.summary). Use when rewriting or improving the summary.',
    parameters: {
      type: 'object',
      properties: {
        summary: {
          type: 'string',
          description: 'The complete new summary text',
        },
      },
      required: ['summary'],
    },
  },
  {
    name: 'update_basics_field',
    description:
      'Update a single top-level field in the basics section. Fields: name, label, email, phone, url, image.',
    parameters: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          enum: ['name', 'label', 'email', 'phone', 'url', 'image'],
          description: 'Which basics field to update',
        },
        value: { type: 'string', description: 'New value for the field' },
      },
      required: ['field', 'value'],
    },
  },
  {
    name: 'update_location',
    description:
      'Update the location in the basics section. Pass only the fields you want to change.',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name' },
        region: { type: 'string', description: 'State/region' },
        countryCode: { type: 'string', description: 'ISO country code (e.g. US, DZ, FR)' },
        postalCode: { type: 'string', description: 'Postal/zip code' },
      },
    },
  },
  {
    name: 'set_profiles',
    description:
      'Replace all social/professional profiles in the basics section. Each profile has network, username, and url.',
    parameters: {
      type: 'object',
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              network: { type: 'string', description: 'e.g. LinkedIn, GitHub, Twitter' },
              username: { type: 'string' },
              url: { type: 'string' },
            },
          },
          description: 'Array of profile objects',
        },
      },
      required: ['profiles'],
    },
  },
  {
    name: 'replace_section',
    description:
      'Replace an entire array section of the resume with new data. The data must be an array of entries matching the JSON Resume schema for that section. Sections: work, education, skills, projects, languages, volunteer, awards, certificates, publications, interests, references.',
    parameters: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: [...ARRAY_SECTIONS],
          description: 'Which section to replace',
        },
        data: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of entries for this section',
        },
      },
      required: ['section', 'data'],
    },
  },
  {
    name: 'add_section_entry',
    description:
      'Append a single new entry to an array section. The entry must match the JSON Resume schema for that section.',
    parameters: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          enum: [...ARRAY_SECTIONS],
          description: 'Which section to add to',
        },
        entry: {
          type: 'object',
          description: 'The entry object to append',
        },
      },
      required: ['section', 'entry'],
    },
  },
];

/* ── Tool executor (writes to Zustand store) ──────────── */

/** Read a nested value from the resume by path, e.g. ['basics','summary'] */
export function getAtPath(resume: ResumeSchema, path: string[]): unknown {
  let cur: unknown = resume;
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** Write a value into the resume at path via the store. */
export function setAtPath(path: string[], value: unknown) {
  const store = useResumeStore.getState();
  if (path[0] === 'basics' && path.length === 2) {
    store.updateBasics(path[1], value);
  } else if (path.length === 1) {
    store.updateArraySection(
      path[0] as keyof ResumeSchema,
      value as ResumeSchema[keyof ResumeSchema],
    );
  }
}

export interface ToolExecResult {
  success: boolean;
  message: string;
  path: string[];
  before: unknown;
}

export function executeResumeTool(call: ToolCall): ToolExecResult {
  const store = useResumeStore.getState();
  const resume = activeSlot(store).resume;

  try {
    switch (call.name) {
      case 'update_summary': {
        const path = ['basics', 'summary'];
        const before = structuredClone(getAtPath(resume, path));
        store.updateBasics('summary', call.args.summary as string);
        return { success: true, message: 'Updated professional summary', path, before };
      }

      case 'update_basics_field': {
        const field = call.args.field as string;
        const path = ['basics', field];
        const before = structuredClone(getAtPath(resume, path));
        store.updateBasics(field, call.args.value as string);
        return { success: true, message: `Updated basics.${field}`, path, before };
      }

      case 'replace_section': {
        const section = call.args.section as string;
        const path = [section];
        const before = structuredClone(getAtPath(resume, path));
        store.updateArraySection(
          section as keyof ResumeSchema,
          call.args.data as ResumeSchema[keyof ResumeSchema],
        );
        return { success: true, message: `Replaced ${section} section`, path, before };
      }

      case 'add_section_entry': {
        const section = call.args.section as string;
        const path = [section];
        const before = structuredClone(getAtPath(resume, path));
        const current = (resume[section as keyof ResumeSchema] as unknown[]) || [];
        store.updateArraySection(
          section as keyof ResumeSchema,
          [...current, call.args.entry] as ResumeSchema[keyof ResumeSchema],
        );
        return { success: true, message: `Added entry to ${section}`, path, before };
      }

      case 'update_location': {
        const path = ['basics', 'location'];
        const before = structuredClone(getAtPath(resume, path));
        const fields = call.args as Record<string, string>;
        for (const [k, v] of Object.entries(fields)) {
          if (typeof v === 'string') store.updateBasicsLocation(k, v);
        }
        return { success: true, message: 'Updated location', path, before };
      }

      case 'set_profiles': {
        const path = ['basics', 'profiles'];
        const before = structuredClone(getAtPath(resume, path));
        store.updateBasics('profiles', call.args.profiles);
        return { success: true, message: 'Updated profiles', path, before };
      }

      default:
        return {
          success: false,
          message: `Unknown tool: ${call.name}`,
          path: [],
          before: undefined,
        };
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Tool execution failed',
      path: [],
      before: undefined,
    };
  }
}
