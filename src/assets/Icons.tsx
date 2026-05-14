import { type SVGProps } from 'react';

export const ChevronDownIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <path d="M3 4.5L6 7.5L9 4.5" />
  </svg>
);

export const DragHandleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" {...props}>
    <circle cx="4" cy="2" r="1.2" />
    <circle cx="8" cy="2" r="1.2" />
    <circle cx="4" cy="6" r="1.2" />
    <circle cx="8" cy="6" r="1.2" />
    <circle cx="4" cy="10" r="1.2" />
    <circle cx="8" cy="10" r="1.2" />
  </svg>
);

export const CopyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const SparkleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0L14.5 7.5C15 9 15 9 16.5 9.5L24 12L16.5 14.5C15 15 15 15 14.5 16.5L12 24L9.5 16.5C9 15 9 15 7.5 14.5L0 12L7.5 9.5C9 9 9 9 9.5 7.5L12 0Z" />
  </svg>
);

export const GlobeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
export const CloseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

export const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 12h14" />
  </svg>
);
