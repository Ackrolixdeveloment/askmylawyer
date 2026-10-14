import type { Section } from "@/content/types";
import { AppCta } from "./app-cta";
import { Categories } from "./categories";
import { CrossCta } from "./cross-cta";
import { Faq } from "./faq";
import { Features } from "./features";
import { Hero } from "./hero";
import { Stats } from "./stats";
import { Steps } from "./steps";

/**
 * Draws one section by its `type`.
 *
 * A page renders by walking its section list, so adding, reordering or hiding
 * a section is a content change rather than a code change. Adding a new type
 * to `Section` without a case here is a type error, so no section can be left
 * silently undrawn.
 */
export function SectionRenderer({ section }: { section: Section }) {
  switch (section.type) {
    case "hero":
      return <Hero section={section} />;
    case "stats":
      return <Stats section={section} />;
    case "steps":
      return <Steps section={section} />;
    case "crossCta":
      return <CrossCta section={section} />;
    case "categories":
      return <Categories section={section} />;
    case "features":
      return <Features section={section} />;
    case "appCta":
      return <AppCta section={section} />;
    case "faq":
      return <Faq section={section} />;
    default:
      return assertNever(section);
  }
}

/**
 * Fails to compile if a `Section` variant has no case above: the parameter is
 * `never`, so an unhandled variant has nothing to pass in.
 */
function assertNever(section: never): never {
  throw new Error(`Unhandled section type: ${(section as Section).type}`);
}
