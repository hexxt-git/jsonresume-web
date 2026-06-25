import type { ResumeSchema } from '@/types/resume';

export const sampleResume: ResumeSchema = {
  basics: {
    name: 'Salah Zeghdani',
    label: 'Web Developer',
    email: 'zeghdns@gmail.com',
    phone: '+213798922617',
    summary:
      'Web Developer specializing in React, Next.js, and TypeScript. I design, build, ship, and handle end-to-end delivery (backend, Stripe billing, web analytics, and deployment) - open to frontend roles or full-stack development work.',
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
      {
        network: 'GitHub',
        username: 'hexxt-git',
        url: 'https://github.com/hexxt-git',
      },
      {
        network: 'hexxt.dev',
        url: 'https://hexxt.dev',
      },
    ],
  },
  work: [
    {
      name: 'bortocall.dz',
      position: 'Frontend Engineer',
      startDate: '2025-12-01',
      location: 'Dar-el-beida, Algiers',
      highlights: [
        "Led the development of the startup's 3 Dashboards and 2 Websites, using a monorepo architecture.",
        'Reviewed colleague code to ensure compliance with high security, performance, and pixel-perfect design.',
      ],
    },
    {
      name: 'mi-conseil.fr',
      position: 'Web developer (contract)',
      startDate: '2025-08-01',
      endDate: '2025-12-01',
      location: 'Paris, France',
      highlights: [
        'Worked on projects including development of www.thetagpoint.com back-office and client web apps.',
        'Converted Figma designs to web applications using React with REST API integration.',
      ],
    },
    {
      name: 'qareeb.io',
      position: 'Frontend Developer',
      startDate: '2025-01-01',
      endDate: '2025-08-01',
      location: 'Remote, Algiers',
      highlights: [
        'Gained experience collaborating within a large team of senior engineers while contributing to major features, including the interface for Wizabot.',
        'rewrote the QFarming web application, focusing on Mapbox integration and real-time data visualization.',
      ],
    },
  ],
  education: [
    {
      institution: 'freecodecamp.org',
      studyType: 'Accelerated Courses in web development',
      endDate: '2022-01-01',
    },
    {
      institution: 'University of Science and Technology Houari Boumediene',
      studyType: "Engineer's degree",
    },
  ],
  skills: [
    {
      name: 'Frontend',
      keywords: [
        'React',
        'NextJs',
        'TailwindCSS',
        'Storybook',
        'Vitest',
        'HTML5',
        'CSS3',
        'JavaScript ES6',
        'TypeScript',
        'Tanstack Libraries',
        'Web Design',
        'Figma',
      ],
    },
    {
      name: 'Backend',
      keywords: ['Node.js', 'NestJs', 'Express', 'Prisma', 'tRPC', 'Linux'],
    },
  ],
  languages: [
    {
      language: 'English',
    },
    {
      language: 'French',
    },
    {
      language: 'Arabic',
    },
  ],
  projects: [
    {
      name: 'advice4cloud TCO Calculator (https://calculator.advice4cloud.com)',
      url: 'https://calculator.advice4cloud.com',
      highlights: [
        'Built and deployed a fully functional SaaS calculator tailored to client business needs, currently generating €100/month per client.',
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
      name: 'anime-sdk (https://anime-sdk.hexxt.dev)',
      url: 'https://anime-sdk.hexxt.dev',
      highlights: [
        'A TypeScript SDK for searching anime and manga across 12 sources and resolving direct stream URLs.',
        'Built for making websites, mobile apps, servers, cli tools and any other user experience.',
      ],
    },
    {
      name: 'High Level Interpreted Programming Language (https://github.com/hexxt-git/bbee-lang)',
      url: 'https://github.com/hexxt-git/bbee-lang',
      highlights: [
        'An exercise in parsing syntax using a Pratt parsing algorithm turned into a high-level programming language.',
      ],
    },
  ],
};
