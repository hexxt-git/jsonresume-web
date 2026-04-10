import type { ResumeSchema } from '../types/resume';

export const sampleResume: ResumeSchema = {
  basics: {
    name: 'Salah Zeghdani',
    label: 'Web Developer',
    email: 'zeghdns@gmail.com',
    phone: '+213798922617',
    summary:
      'Web Developer specializing in React, Next.js and TypeScript. I design, build, ship and handle end-to-end delivery (backend, stripe billing, web analytics and deployment) -- open to frontend roles and/or fullstack development work.',
    location: {
      city: 'Algiers',
      countryCode: 'DZ',
      region: 'Algeria',
    },
    profiles: [
      {
        network: 'LinkedIn',
        username: 'zeghdani',
        url: 'https://www.linkedin.com/in/zeghdani',
      },
    ],
  },
  work: [
    {
      name: 'bortocall.dz',
      position: 'Frontend Engineer',
      startDate: '2025-12-01',
      location: 'Alger, Algiers',
      highlights: [
        'Led the development of the startups 3 Dashboard and 2 Websites, using a monorepo architecture.',
        'Reviewed colleague code to ensure compliance with high standard of security, performance and pixel perfect design.',
      ],
    },
    {
      name: 'mi-conseil.fr',
      position: 'Web developer',
      startDate: '2025-08-01',
      endDate: '2025-12-01',
      location: 'Paris, France',
      highlights: [
        'Worked on multiple projects and led the development of www.thetagpoint.com backoffice and client facing web-apps.',
        'Converted figma designs to web applications using React with REST API integration.',
      ],
    },
    {
      name: 'qareeb.io',
      position: 'Frontend Developer',
      startDate: '2025-01-01',
      endDate: '2025-08-01',
      location: 'Alger, Algiers',
      highlights: [
        'Gained experience collaborating within a large team of senior engineers while contributing to major features, including the interface for Wizabot.',
        'Led the rewrite of the QFarming web application, focusing on Mapbox integration and real-time data visualization.',
      ],
    },
  ],
  education: [
    {
      institution: 'University of Science and Technology Houari Boumediene',
      studyType: "Engineer's degree",
    },
    {
      institution: 'freecodecamp.org',
      studyType: 'Accelerated Courses in web development',
      endDate: '2022-01-01',
    },
  ],
  skills: [
    {
      name: 'Frontend',
      keywords: [
        'React.js',
        'Next.js',
        'TailwindCSS',
        'Svelte',
        'SvelteKit',
        'HTML',
        'CSS',
        'JavaScript',
        'TypeScript',
        'Web Design',
      ],
    },
    {
      name: 'Backend',
      keywords: [
        'Node.js',
        'Express',
        'Prisma',
        'SQL (PostgreSQL, MySQL)',
        'REST APIs',
        'tRPC APIs',
        'Python',
        'Linux',
        'Rapid Prototyping',
        'Problem-Solving',
      ],
    },
    {
      name: 'Mobile',
      keywords: ['Swift', 'SwiftUI', 'xCode'],
    },
  ],
  languages: [{ language: 'English' }, { language: 'French' }, { language: 'Arabic' }],
  projects: [
    {
      name: 'advice4cloud TCO Calculator',
      url: 'https://calculator.advice4cloud.com',
      highlights: [
        'Built and deployed a fully functional SaaS calculator tailored to client business needs, currently generating \u20ac100/month per client.',
        'Integrated AI-powered features and recurring subscription payments via Stripe, while maintaining and operating the product in production.',
      ],
    },
    {
      name: '3chrin.com',
      url: 'https://3chrin.com',
      highlights: [
        'Built a web-based micro-learning platform for baccalaureate students, featuring interactive lessons, progress tracking, and gamified streaks.',
        'Launched now live with a growing community and curated content across math, physics, and natural sciences.',
      ],
    },
    {
      name: 'clean-asset-repository.com',
      url: 'https://clean-asset-repository.com',
      highlights: [
        'Built a curated library of 1700+ creative assets with an engaged community, optimized for fast delivery.',
        'Released all assets under CC0, enabling free personal and commercial use with fast, reliable access.',
      ],
    },
    {
      name: 'BBEE | High Level Interpreted Programming Language',
      url: 'https://github.com/hexxt-git/bbee',
      highlights: [
        'An exercise in parsing syntax using a Pratt parsing algorithm turned into a high-level programming language.',
      ],
    },
  ],
};
