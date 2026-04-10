/**
 * JSON Resume Schema v1.0.0
 * Generated from jsonresume-theme-even/dist/schema.d.ts
 */

export type Iso8601 = string;

export interface ResumeSchema {
  $schema?: string;
  basics?: {
    name?: string;
    label?: string;
    image?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: {
      address?: string;
      postalCode?: string;
      city?: string;
      countryCode?: string;
      region?: string;
      [k: string]: unknown;
    };
    profiles?: {
      network?: string;
      username?: string;
      url?: string;
      [k: string]: unknown;
    }[];
    [k: string]: unknown;
  };
  work?: {
    name?: string;
    location?: string;
    description?: string;
    position?: string;
    url?: string;
    startDate?: Iso8601;
    endDate?: Iso8601;
    summary?: string;
    highlights?: string[];
    [k: string]: unknown;
  }[];
  volunteer?: {
    organization?: string;
    position?: string;
    url?: string;
    startDate?: Iso8601;
    endDate?: Iso8601;
    summary?: string;
    highlights?: string[];
    [k: string]: unknown;
  }[];
  education?: {
    institution?: string;
    url?: string;
    area?: string;
    studyType?: string;
    startDate?: Iso8601;
    endDate?: Iso8601;
    score?: string;
    courses?: string[];
    [k: string]: unknown;
  }[];
  awards?: {
    title?: string;
    date?: Iso8601;
    awarder?: string;
    summary?: string;
    [k: string]: unknown;
  }[];
  certificates?: {
    name?: string;
    date?: Iso8601;
    url?: string;
    issuer?: string;
    [k: string]: unknown;
  }[];
  publications?: {
    name?: string;
    publisher?: string;
    releaseDate?: Iso8601;
    url?: string;
    summary?: string;
    [k: string]: unknown;
  }[];
  skills?: {
    name?: string;
    level?: string;
    keywords?: string[];
    [k: string]: unknown;
  }[];
  languages?: {
    language?: string;
    fluency?: string;
    [k: string]: unknown;
  }[];
  interests?: {
    name?: string;
    keywords?: string[];
    [k: string]: unknown;
  }[];
  references?: {
    name?: string;
    reference?: string;
    [k: string]: unknown;
  }[];
  projects?: {
    name?: string;
    description?: string;
    highlights?: string[];
    keywords?: string[];
    startDate?: Iso8601;
    endDate?: Iso8601;
    url?: string;
    roles?: string[];
    entity?: string;
    type?: string;
    [k: string]: unknown;
  }[];
  meta?: {
    canonical?: string;
    version?: string;
    lastModified?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
