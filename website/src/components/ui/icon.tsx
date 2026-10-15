import {
  Briefcase,
  Clock,
  CreditCard,
  Globe,
  Heart,
  AtSign,
  Camera,
  Home,
  Lock,
  MessageSquare,
  Plane,
  Receipt,
  Scale,
  Shield,
  ShieldCheck,
  Share2,
  ShoppingBag,
  TriangleAlert,
  Users,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Icons the content may name.
 *
 * Deliberately a fixed map rather than a lookup over everything lucide
 * exports: the CMS should only offer icons the design actually uses, and an
 * unknown name must not be able to break a page.
 */
const icons: Record<string, LucideIcon> = {
  ShieldCheck,
  Lock,
  Zap,
  CreditCard,
  Scale,
  Video,
  Clock,
  MessageSquare,
  Home,
  Heart,
  Shield,
  ShoppingBag,
  Briefcase,
  Plane,
  Receipt,
  Users,
  Globe,
  TriangleAlert,
  // lucide dropped its brand marks, so socials use generic glyphs; each link
  // carries its own aria-label, which is what a screen reader announces.
  AtSign,
  Camera,
  Share2,
};

/** Every icon name the CMS may offer, for the editor's picker. */
export const iconNames = Object.keys(icons);

/** Renders a named icon, or nothing when the name is unknown. */
export function Icon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const Resolved = name ? icons[name] : undefined;
  if (!Resolved) return null;
  return <Resolved className={className} aria-hidden />;
}
