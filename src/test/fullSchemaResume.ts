import type { ResumeSchema } from '../types/resume';

/**
 * A resume that populates EVERY field in the JSON Resume v1.0.0 schema.
 * Used to test that themes don't silently drop fields.
 */
export const fullSchemaResume: ResumeSchema = {
  basics: {
    name: 'Jane Fullschema',
    label: 'Senior Engineer',
    image: 'https://example.com/photo.jpg',
    email: 'jane@fullschema.test',
    phone: '+1-555-000-1234',
    url: 'https://janefullschema.dev',
    summary: 'Full schema test summary paragraph.',
    location: {
      address: '123 Test Street',
      postalCode: '94107',
      city: 'San Francisco',
      countryCode: 'US',
      region: 'California',
    },
    profiles: [
      {
        network: 'GitHub',
        username: 'janefull',
        url: 'https://github.com/janefull',
      },
    ],
  },
  work: [
    {
      name: 'FullCorp',
      location: 'Remote',
      description: 'A test company description',
      position: 'Lead Engineer',
      url: 'https://fullcorp.test',
      startDate: '2022-01',
      endDate: '2024-06',
      summary: 'Led engineering team on platform work.',
      highlights: ['Shipped v2 platform', 'Reduced latency by 40%'],
    },
  ],
  volunteer: [
    {
      organization: 'Code For Good',
      position: 'Mentor',
      url: 'https://codeforgood.test',
      startDate: '2021-03',
      endDate: '2022-01',
      summary: 'Mentored junior developers weekly.',
      highlights: ['Guided 12 mentees'],
    },
  ],
  education: [
    {
      institution: 'MIT',
      url: 'https://mit.edu',
      area: 'Computer Science',
      studyType: 'Bachelor',
      startDate: '2014-09',
      endDate: '2018-06',
      score: '3.9',
      courses: ['Algorithms', 'Distributed Systems', 'Machine Learning'],
    },
  ],
  awards: [
    {
      title: 'Best Paper Award',
      date: '2023-11',
      awarder: 'ACM',
      summary: 'Awarded for outstanding research.',
    },
  ],
  certificates: [
    {
      name: 'AWS Solutions Architect',
      date: '2023-03',
      url: 'https://aws.cert.test',
      issuer: 'Amazon',
    },
  ],
  publications: [
    {
      name: 'Scaling Distributed Systems',
      publisher: 'IEEE',
      releaseDate: '2023-06',
      url: 'https://ieee.test/paper',
      summary: 'A study on horizontal scaling patterns.',
    },
  ],
  skills: [
    {
      name: 'Frontend',
      level: 'Expert',
      keywords: ['React', 'TypeScript', 'CSS'],
    },
    {
      name: 'Backend',
      level: 'Advanced',
      keywords: ['Node.js', 'PostgreSQL'],
    },
  ],
  languages: [
    { language: 'English', fluency: 'Native' },
    { language: 'Spanish', fluency: 'Conversational' },
  ],
  interests: [
    {
      name: 'Open Source',
      keywords: ['Linux', 'Vim', 'Rust'],
    },
  ],
  references: [
    {
      name: 'Tim Testref',
      reference: 'Jane is an exceptional engineer and collaborator.',
    },
  ],
  projects: [
    {
      name: 'TestProject',
      description: 'A full-schema test project.',
      highlights: ['Built entire MVP', 'Deployed to production'],
      keywords: ['React', 'GraphQL', 'Docker'],
      startDate: '2023-01',
      endDate: '2023-12',
      url: 'https://testproject.dev',
      roles: ['Lead Developer', 'Architect'],
      entity: 'OpenSource Foundation',
      type: 'application',
    },
  ],
};
