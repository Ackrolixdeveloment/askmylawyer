/**
 * Shapes for the landing-page content.
 *
 * These are written as plain data rather than JSX because the same structure
 * becomes the CMS payload later: a page is an ordered list of sections, and
 * the header builds its menu from that list. Moving to the CMS then changes
 * only where a `PageContent` comes from, not how it is rendered.
 */

/** A call-to-action button. */
export interface Cta {
  label: string;
  href: string;
}

/** An app-store badge in the download sections. */
export interface StoreLink {
  store: "ios" | "android";
  href: string;
}

/**
 * One trust marker in the dark strip under the hero: an icon above a name
 * and the promise under it, e.g. "Bar Council / VERIFIED LAWYERS".
 */
export interface Stat {
  /** The bold line, e.g. "Bar Council" or "4.9". */
  value: string;
  /** The small line under it, e.g. "VERIFIED LAWYERS". */
  label: string;
  /** Lucide icon name, resolved when the strip renders. */
  icon?: string;
}

/** A short reassurance shown with a tick beside the hero's buttons. */
export interface HeroAssurance {
  label: string;
}

/**
 * The floating card beside the hero. It mimics the app's own "ask a question"
 * form, so its pieces are content rather than markup.
 */
export interface HeroCard {
  title: string;
  placeholder: string;
  /** Practice-area chips under the input. */
  chips: string[];
  cta: Cta;
  /** The rating pill that overlaps the card's lower edge. */
  rating?: { value: string; label: string };
  /** The accepted-request pill above the card. */
  notice?: { name: string; body: string };
}

/** A numbered step in the "how it works" / onboarding lists. */
export interface Step {
  title: string;
  body: string;
  /** Lucide icon name, resolved when the step renders. */
  icon?: string;
  /** Tints the step's icon tile; the first step is usually highlighted. */
  tone?: "brand" | "positive" | "accent" | "warn" | "neutral";
}

/** A feature or reason-to-trust tile. */
export interface Feature {
  title: string;
  body: string;
  /** Lucide icon name, resolved when the tile renders. */
  icon?: string;
}

/** A practice area shown as a chip or card. */
export interface Category {
  label: string;
  /** Lucide icon name, resolved when the chip renders. */
  icon?: string;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Every section carries its own menu entry, so the header is derived from the
 * page rather than listed separately — reordering or hiding a section moves
 * or removes its menu item with it.
 */
interface SectionBase {
  /** Unique within a page; also the scroll target, e.g. `#trust`. */
  anchor: string;
  /** Menu text. Omitted for sections that should not appear in the menu. */
  navLabel?: string;
  /** False hides the section from both the page and the menu. */
  visible?: boolean;
}

export interface HeroSection extends SectionBase {
  type: "hero";
  eyebrow?: string;
  /** Rendered as separate lines, so the break is a content decision. */
  heading: string[];
  body: string;
  assurances?: HeroAssurance[];
  ctas?: Cta[];
  stores?: StoreLink[];
  card?: HeroCard;
}

export interface StatsSection extends SectionBase {
  type: "stats";
  stats: Stat[];
}

export interface StepsSection extends SectionBase {
  type: "steps";
  eyebrow?: string;
  heading: string;
  body?: string;
  /**
   * How the steps are laid out. "cards" spreads them across a row of icon
   * tiles; "list" stacks them as a numbered sequence, which suits a process
   * that has to be followed in order.
   */
  layout?: "cards" | "list";
  steps: Step[];
}

export interface FeaturesSection extends SectionBase {
  type: "features";
  eyebrow?: string;
  heading: string;
  body?: string;
  /** Illustration shown beside the tiles. */
  image?: string;
  /** Describes the illustration for screen readers. */
  imageAlt?: string;
  features: Feature[];
}

export interface CategoriesSection extends SectionBase {
  type: "categories";
  eyebrow?: string;
  heading: string;
  body?: string;
  categories: Category[];
}

/** The tinted panel pointing the other audience at their own page. */
export interface CrossCtaSection extends SectionBase {
  type: "crossCta";
  eyebrow?: string;
  /** Lucide icon name shown inside the eyebrow pill. */
  eyebrowIcon?: string;
  heading: string;
  /** Lines under the heading, set in the panel's accent colour. */
  subheading?: string[];
  body: string;
  assurances?: HeroAssurance[];
  ctas?: Cta[];
  stores?: StoreLink[];
  /** Screenshot of the lawyer app, shown beside the copy. */
  image?: string;
  /** Floating figures that overlap the screenshot. */
  badges?: CrossCtaBadge[];
}

/** A small card that overlaps the panel's screenshot. */
export interface CrossCtaBadge {
  /** Where it sits against the image. */
  position: "top-left" | "bottom-right";
  /** Small line above the figure, e.g. "WEEKLY EARNINGS". */
  kicker?: string;
  /** The bold line, e.g. "₹24,600" or "Bar Council Verified". */
  value: string;
  /** Small line under it, e.g. "+ 15.4% this week". */
  note?: string;
  icon?: string;
}

export interface AppCtaSection extends SectionBase {
  type: "appCta";
  eyebrow?: string;
  /** Rendered as separate lines, so the break is a content decision. */
  heading: string[];
  body?: string;
  stores: StoreLink[];
  /**
   * Scan-to-install code shown beside the store badges. The label is a list
   * of lines, so where it wraps stays a content decision.
   */
  qr?: { image: string; label: string[] };
  /** Screenshot of the app, shown beside the copy. */
  image?: string;
}

export interface FaqSection extends SectionBase {
  type: "faq";
  eyebrow?: string;
  heading: string;
  body?: string;
  entries: FaqEntry[];
}

export type Section =
  | HeroSection
  | StatsSection
  | StepsSection
  | FeaturesSection
  | CategoriesSection
  | CrossCtaSection
  | AppCtaSection
  | FaqSection;

/** A column of links in the footer. */
export interface FooterColumn {
  heading: string;
  links: Cta[];
}

/** A social account, shown as a small round button. */
export interface SocialLink {
  /** Lucide icon name, resolved when the footer renders. */
  icon: string;
  /** Names the destination for screen readers, e.g. "X" or "Instagram". */
  label: string;
  href: string;
}

/**
 * The footer. Kept apart from `sections` because it is not a menu item and
 * never moves — it always closes the page.
 */
export interface FooterContent {
  /** Short pitch under the wordmark. */
  blurb: string;
  socials?: SocialLink[];
  columns: FooterColumn[];
  copyright: string;
  /** The small note on the right, e.g. "Made in India". */
  note?: string;
}

/** One landing page: its sections, plus what search engines should see. */
export interface PageContent {
  /** Matches the CMS row id, e.g. "customer" or "lawyer". */
  slug: string;
  seo: {
    title: string;
    description: string;
  };
  sections: Section[];
  footer: FooterContent;
}

/** Sections that belong in the header menu, in page order. */
export function navItems(page: PageContent) {
  return page.sections
    .filter((section) => section.visible !== false && section.navLabel)
    .map((section) => ({
      label: section.navLabel as string,
      href: `#${section.anchor}`,
    }));
}

/** Sections to render, in page order. */
export function visibleSections(page: PageContent) {
  return page.sections.filter((section) => section.visible !== false);
}
