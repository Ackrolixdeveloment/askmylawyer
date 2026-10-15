import type { PageContent } from "./types";

/**
 * The lawyer landing page.
 *
 * Placeholder copy for now — the structure is what matters, since this object
 * becomes the CMS row for `lawyer` later on. Note the shorter menu: this page
 * has no Categories or Lawyer CTA section, so neither appears in its header.
 */
export const lawyerPage: PageContent = {
  slug: "lawyer",
  seo: {
    title: "Ask My Lawyer — Consult from anywhere.",
    description:
      "Join Ask My Lawyer and take consultations from anywhere in India, on your own schedule.",
  },
  sections: [
    {
      type: "hero",
      anchor: "top",
      eyebrow: "For Advocates",
      heading: ["Practicing law?", "Consult from anywhere."],
      body: "Connect with clients, manage consultations, and build your practice through a trusted digital legal platform.",
      assurances: [
        { label: "Zero setup fees" },
        { label: "Verified in 48 hours" },
        { label: "Instant payouts" },
      ],
      stores: [
        { store: "ios", href: "#" },
        { store: "android", href: "#" },
      ],
    },
    {
      type: "stats",
      anchor: "trust",
      navLabel: "Trust",
      stats: [
        {
          value: "100%",
          label: "Digital consultation process",
          icon: "ShieldCheck",
        },
        { value: "100%", label: "Digital process", icon: "Lock" },
        { value: "₹799", label: "Consultation starting", icon: "Zap" },
        { value: "24/7", label: "Client access", icon: "CreditCard" },
      ],
    },
    {
      type: "steps",
      anchor: "onboarding",
      navLabel: "Onboarding",
      eyebrow: "Onboarding",
      heading: "Verified. Trusted. Transparent.",
      body: "Every lawyer on our platform goes through the same rigorous checks.",
      layout: "list",
      steps: [
        {
          title: "Sign up & basic info",
          body: "Name, mobile, email, Bar Council enrollment number and state.",
        },
        {
          title: "Document upload",
          body: "Bar Council certificate, government ID (PAN/Aadhaar), professional photo, PAN card.",
        },
        {
          title: "Bar Council verification",
          body: "Our team cross-checks your enrollment against Bar Council of India records.",
        },
        {
          title: "Bank & payout setup",
          body: "Add bank details for direct deposits. Penny-drop verification takes seconds.",
        },
        {
          title: "Profile & specialization",
          body: "Add your bio, specializations, languages, courts of practice, and availability.",
        },
      ],
    },
    {
      type: "features",
      anchor: "why",
      navLabel: "Why?",
      eyebrow: "WHY ASK MY LAWYER",
      heading: "Built to help lawyers do more.",
      body: "Connect with clients who need your expertise, manage consultations on your terms, and grow your professional presence — all in one place.",
      image: "/ask-lawyer.png",
      imageAlt: "A lawyer taking a client consultation from their desk",
      features: [
        {
          title: "Relevant Client Connections",
          body: "Get connected with people looking for legal guidance in your area of expertise.",
          icon: "Users",
        },
        {
          title: "Build Your Professional Presence",
          body: "Showcase your expertise, practice areas, and experience to potential clients.",
          icon: "Briefcase",
        },
        {
          title: "Full compliance built-in",
          body: "Bar Council of India guidelines respected. We function purely as a technology intermediary — you're always the advocate.",
          icon: "ShieldCheck",
        },
        {
          title: "Simple, Secure Payments",
          body: "Focus on the consultation while we handle the payment process securely.",
          icon: "CreditCard",
        },
      ],
    },
    {
      type: "appCta",
      anchor: "app",
      navLabel: "App",
      eyebrow: "ASK MY LAWYER APP",
      heading: ["Legal guidance, right", "from your phone."],
      stores: [
        { store: "android", href: "#" },
        { store: "ios", href: "#" },
      ],
      qr: {
        image: "/apple_app_download 1.png",
        label: ["Scan to", "download the app"],
      },
      image: "/Group 1848304737.png",
    },
    {
      type: "faq",
      anchor: "faq",
      navLabel: "FAQ's",
      eyebrow: "FAQ",
      heading: "Frequently Asked Qiestions",
      entries: [
        {
          question: "Is there any joining fee or subscription?",
          answer:
            "Zero. No joining fee, no monthly subscription. We only earn when you earn — 20% commission on each consultation you complete.",
        },
        {
          question: "How do payouts work?",
          answer: "Placeholder answer — replace with the real copy.",
        },
        {
          question: "Am I obligated to accept every call?",
          answer: "Placeholder answer — replace with the real copy.",
        },
        {
          question: "Does this violate Bar Council of India rules?",
          answer: "Placeholder answer — replace with the real copy.",
        },
        {
          question: "Can I take clients off-platform after first consultation?",
          answer: "Placeholder answer — replace with the real copy.",
        },
      ],
    },
  ],
  footer: {
    blurb:
      "India's most trusted legal consultation platform. Verified lawyers, secure conversations, real advice.",
    socials: [
      { icon: "AtSign", label: "X", href: "#" },
      { icon: "Camera", label: "Instagram", href: "#" },
      { icon: "Share2", label: "LinkedIn", href: "#" },
    ],
    columns: [
      {
        heading: "PRODUCT",
        links: [
          { label: "Onboarding", href: "#onboarding" },
          { label: "Why Ask My lawyer", href: "#why" },
          { label: "App Link", href: "#app" },
          { label: "For clients", href: "/" },
        ],
      },
      {
        heading: "LEGAL",
        links: [
          { label: "Terms of service", href: "#" },
          { label: "Privacy policy", href: "#" },
          { label: "Refund policy", href: "#" },
          { label: "Grievance officer", href: "#" },
        ],
      },
    ],
    copyright: "© 2026 Ask My Lawyer",
    note: "Made in India",
  },
};
