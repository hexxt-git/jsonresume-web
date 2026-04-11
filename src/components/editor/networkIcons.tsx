import {
  // General professional
  siXing,
  siGlassdoor,
  siIndeed,
  siUpwork,
  siFreelancer,
  siFiverr,
  siToptal,
  siWellfound,
  // Dev / Tech
  siGithub,
  siGitlab,
  siBitbucket,
  siGitea,
  siCodeproject,
  siReplit,
  siNpm,
  siPypi,
  siDocker,
  siStackoverflow,
  siHackerrank,
  siCodeforces,
  siCodechef,
  siCodewars,
  siTopcoder,
  siLeetcode,
  siKaggle,
  siGitconnected,
  // Design / Creative
  siDribbble,
  siBehance,
  siArtstation,
  siFigma,
  siDeviantart,
  siPixiv,
  si500px,
  siUnsplash,
  siPinterest,
  siVimeo,
  // Academic / Research
  siGooglescholar,
  siOrcid,
  siResearchgate,
  siAcademia,
  siArxiv,
  siSemanticscholar,
  siZotero,
  siOverleaf,
  siIeee,
  siAcm,
  // Writing / Content
  siMedium,
  siDevdotto,
  siHashnode,
  siSubstack,
  siWordpress,
  siGhost,
  siWattpad,
  siGoodreads,
  // Video / Streaming
  siYoutube,
  siTwitch,
  siSpotify,
  siSoundcloud,
  siBandcamp,
  // Social
  siX,
  siBluesky,
  siMastodon,
  siThreads,
  siInstagram,
  siFacebook,
  siReddit,
  siTiktok,
  siSnapchat,
  siDiscord,
  siTelegram,
  siWhatsapp,
  siSignal,
  // Business
  siCrunchbase,
  siProducthunt,
  siNotion,
  siLinktree,
  // Monetization
  siPatreon,
  siKofi,
  siBuymeacoffee,
  siGumroad,
} from 'simple-icons';
import { useState, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useT } from '../../i18n';

interface BrandIcon {
  path: string;
  hex: string;
}

// LinkedIn was removed from simple-icons; path from the official logo
const LINKEDIN: BrandIcon = {
  path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  hex: '0A66C2',
};

const ICONS: Record<string, BrandIcon> = {
  // ── General Professional ──
  LinkedIn: LINKEDIN,
  Xing: siXing,
  Glassdoor: siGlassdoor,
  Indeed: siIndeed,
  Wellfound: siWellfound,
  Upwork: siUpwork,
  Freelancer: siFreelancer,
  Fiverr: siFiverr,
  Toptal: siToptal,
  // ── Dev / Tech ──
  GitHub: siGithub,
  GitLab: siGitlab,
  Bitbucket: siBitbucket,
  Gitea: siGitea,
  CodeProject: siCodeproject,
  Replit: siReplit,
  npm: siNpm,
  PyPI: siPypi,
  Docker: siDocker,
  'Stack Overflow': siStackoverflow,
  HackerRank: siHackerrank,
  Codeforces: siCodeforces,
  CodeChef: siCodechef,
  Codewars: siCodewars,
  TopCoder: siTopcoder,
  LeetCode: siLeetcode,
  Kaggle: siKaggle,
  Gitconnected: siGitconnected,
  // ── Design / Creative ──
  Dribbble: siDribbble,
  Behance: siBehance,
  ArtStation: siArtstation,
  Figma: siFigma,
  DeviantArt: siDeviantart,
  Pixiv: siPixiv,
  '500px': si500px,
  Unsplash: siUnsplash,
  Pinterest: siPinterest,
  Vimeo: siVimeo,
  // ── Academic / Research ──
  'Google Scholar': siGooglescholar,
  ORCID: siOrcid,
  ResearchGate: siResearchgate,
  Academia: siAcademia,
  arXiv: siArxiv,
  'Semantic Scholar': siSemanticscholar,
  Zotero: siZotero,
  Overleaf: siOverleaf,
  IEEE: siIeee,
  ACM: siAcm,
  // ── Writing / Content ──
  Medium: siMedium,
  'Dev.to': siDevdotto,
  Hashnode: siHashnode,
  Substack: siSubstack,
  WordPress: siWordpress,
  Ghost: siGhost,
  Wattpad: siWattpad,
  Goodreads: siGoodreads,
  // ── Video / Audio ──
  YouTube: siYoutube,
  Twitch: siTwitch,
  Spotify: siSpotify,
  SoundCloud: siSoundcloud,
  Bandcamp: siBandcamp,
  // ── Social ──
  Twitter: siX,
  Bluesky: siBluesky,
  Mastodon: siMastodon,
  Threads: siThreads,
  Instagram: siInstagram,
  Facebook: siFacebook,
  Reddit: siReddit,
  TikTok: siTiktok,
  Snapchat: siSnapchat,
  Discord: siDiscord,
  Telegram: siTelegram,
  WhatsApp: siWhatsapp,
  Signal: siSignal,
  // ── Business ──
  Crunchbase: siCrunchbase,
  'Product Hunt': siProducthunt,
  Notion: siNotion,
  Linktree: siLinktree,
  // ── Monetization ──
  Patreon: siPatreon,
  'Ko-fi': siKofi,
  'Buy Me a Coffee': siBuymeacoffee,
  Gumroad: siGumroad,
};

const NEEDS_BG = new Set(['GitHub']);

export function NetworkIcon({ name, size = 16 }: { name: string; size?: number }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={`#${icon.hex}`} className="shrink-0">
      {NEEDS_BG.has(name) && <circle cx="12" cy="12" r="12" fill="white" />}
      <path d={icon.path} />
    </svg>
  );
}

/** Ordered list of all supported network names */
export const NETWORK_NAMES = Object.keys(ICONS);

/**
 * Compact network picker: a small icon button that opens a grid popover.
 */
export function NetworkPickerButton({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const q = filter.toLowerCase();
  const filtered = q ? NETWORK_NAMES.filter((n) => n.toLowerCase().includes(q)) : NETWORK_NAMES;

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    } else {
      setFilter('');
    }
  }, [open]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="h-[34px] shrink-0 flex items-center justify-center gap-2 px-2 border border-border-input bg-bg-input rounded-md
            hover:bg-bg-hover cursor-pointer transition-colors"
          title={value || t('basics.network')}
        >
          {value && ICONS[value] ? (
            <NetworkIcon name={value} size={18} />
          ) : (
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-text-muted"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          )}
          {value && <span className="text-xs text-text-muted">{value}</span>}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-[280px] rounded-lg border border-border bg-bg shadow-lg"
          sideOffset={4}
          align="start"
        >
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filter.trim()) {
                  onChange(filter.trim());
                  setOpen(false);
                }
              }}
              placeholder={t('combo.search')}
              className="w-full px-2 py-1 text-xs bg-bg-input border border-border-input rounded-md text-text
                focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1">
            <div className="grid grid-cols-2 gap-0.5">
              {filtered.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 px-2 py-1.5 text-xs rounded-md text-left cursor-pointer truncate
                    ${value === name ? 'bg-bg-accent text-accent-text font-medium' : 'hover:bg-bg-hover text-text-secondary'}`}
                >
                  <NetworkIcon name={name} size={14} />
                  <span className="truncate">{name}</span>
                </button>
              ))}
            </div>
          </div>
          {filter.trim() && filtered.length === 0 && (
            <div className="px-2 pb-2">
              <button
                type="button"
                onClick={() => {
                  onChange(filter.trim());
                  setOpen(false);
                }}
                className="w-full text-xs text-accent hover:underline cursor-pointer py-1"
              >
                {t('combo.use')} &ldquo;{filter.trim()}&rdquo;
              </button>
            </div>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
