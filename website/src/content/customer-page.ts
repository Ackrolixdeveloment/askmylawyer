import type { PageContent } from "./types";

/**
 * The customer landing page.
 *
 * Placeholder copy for now — the structure is what matters, since this object
 * becomes the CMS row for `customer` later on. Replace the strings as the real
 * copy arrives; no component has to change.
 */
export const customerPage: PageContent = {
  slug: "customer",
  seo: {
    title: "Ask My Lawyer — Legal help, simplified.",
    description:
      "Ask a legal question and speak to a verified lawyer by audio, video or chat.",
  },
  sections: [
    {
      type: "hero",
      anchor: "top",
      eyebrow: "LEGAL HELP, SIMPLIFIED",
      heading: ["Have a legal question?", "Ask a lawyer."],
      body: "Get clear, practical legal guidance from qualified lawyers without the hassle of visiting a law office.",
      assurances: [
        { label: "Bar Council verified" },
        { label: "100% encrypted" },
        { label: "Instant refunds" },
      ],
      stores: [
        { store: "ios", href: "#" },
        { store: "android", href: "#" },
      ],
      card: {
        title: "Need Legal Advice?",
        placeholder: "Tell us about your legal issue…",
        chips: ["Property", "Family", "Criminal", "Consumer", "Business"],
        cta: { label: "Find a Lawyer", href: "#app" },
        rating: { value: "4.9", label: "from consultations" },
        notice: { name: "Adv. Rahul Kumar", body: "Accepted your request" },
      },
    },
    {
      type: "stats",
      anchor: "trust",
      navLabel: "Trust",
      stats: [
        { value: "Bar Council", label: "Verified lawyers", icon: "ShieldCheck" },
        { value: "End-to-End", label: "Encrypted calls", icon: "Lock" },
        { value: "Instant", label: "Refund policy", icon: "Zap" },
        { value: "Razorpay", label: "Secure payments", icon: "CreditCard" },
      ],
    },
    {
      type: "steps",
      anchor: "how-it-works",
      navLabel: "How it works",
      eyebrow: "CONSULT A LAWYER",
      heading: "Talk to a lawyer in 4 easy steps.",
      body: "From opening the app to getting real legal advice — under 3 minutes.",
      steps: [
        {
          title: "Choose your issue",
          body: "Pick from family law, property disputes, criminal cases, corporate matters, and 20+ other legal categories.",
          icon: "Scale",
          tone: "warn",
        },
        {
          title: "Pick a format",
          body: "Video call, audio call, chat or in-person meeting. Whatever works for your situation and comfort.",
          icon: "Video",
          tone: "positive",
        },
        {
          title: "Get matched instantly",
          body: "Our system finds the right verified lawyer for your case in under 45 seconds. Or schedule for later.",
          icon: "Clock",
          tone: "brand",
        },
        {
          title: "Talk. Get advice.",
          body: "Speak freely with your lawyer. Get a written summary after the call. Follow up whenever you need.",
          icon: "MessageSquare",
          tone: "accent",
        },
      ],
    },
    {
      type: "crossCta",
      anchor: "lawyer-cta",
      navLabel: "Lawyer CTA",
      eyebrow: "FOR ADVOCATES",
      eyebrowIcon: "Scale",
      heading: "Are you a lawyer?",
      subheading: ["Grow your practice.", "From anywhere in India."],
      body: "Consult verified clients on your own schedule. Get paid weekly while we handle payments, KYC, and marketing.",
      assurances: [
        { label: "Only KYC-verified clients" },
        { label: "Practice on your terms" },
        { label: "Weekly payouts, 88% take-home" },
        { label: "Focus on law, we handle the rest" },
      ],
      stores: [
        { store: "android", href: "#" },
        { store: "ios", href: "#" },
      ],
      image: "/mobile.png",
      badges: [
        {
          position: "top-left",
          kicker: "WEEKLY EARNINGS",
          value: "₹24,600",
          note: "+ 15.4% this week",
        },
        {
          position: "bottom-right",
          value: "Bar Council Verified",
          note: "Payout weekly Saturday",
          icon: "ShieldCheck",
        },
      ],
    },
    {
      type: "categories",
      anchor: "categories",
      navLabel: "Categories",
      eyebrow: "LEGAL CATEGORIES",
      heading: "Expertise across every legal need.",
      body: "From property disputes to divorce, our verified lawyers cover every major area of Indian law.",
      categories: [
        { label: "Property & Real Estate", icon: "Home" },
        { label: "Family & Matrimonial", icon: "Heart" },
        { label: "Criminal Law", icon: "Shield" },
        { label: "Consumer", icon: "ShoppingBag" },
        { label: "Business & Corporate", icon: "Briefcase" },
        { label: "Immigration", icon: "Plane" },
        { label: "Tax & GST", icon: "Receipt" },
        { label: "Labour & Employment", icon: "Users" },
        { label: "Cyber Law", icon: "Globe" },
        { label: "Accident", icon: "TriangleAlert" },
      ],
    },
    {
      type: "features",
      anchor: "why",
      navLabel: "Why?",
      eyebrow: "WHY ASK MY LAWYER",
      heading: "Legal help built for real life.",
      image: "/ask-lawyer.png",
      imageAlt: "A client consulting a lawyer over a video call",
      features: [
        {
          title: "Bar Council verified",
          body: "Every lawyer on our platform is verified against the Bar Council of India registry. No fake credentials, ever.",
          icon: "ShieldCheck",
        },
        {
          title: "End-to-end encryption",
          body: "Your conversations, documents, and case details are protected with bank-grade encryption. Nothing leaks.",
          icon: "Lock",
        },
        {
          title: "Language of your choice",
          body: "Consult in Hindi, English, Tamil, Bengali, Marathi, Punjabi, and more. Find a lawyer who speaks your language.",
          icon: "Globe",
        },
        {
          title: "Instant refunds",
          body: "If no lawyer accepts your consultation, you get your money back instantly. No emails. No waiting.",
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
          question: "How quickly can I talk to a lawyer?",
          answer:
            "During business hours, most consultations start in under 45 seconds. Outside peak hours, expect 1–3 minutes. If no lawyer accepts within 5 minutes, you get a full refund automatically.",
        },
        {
          question: "Are the lawyers really verified?",
          answer: "Placeholder answer — replace with the real copy.",
        },
        {
          question: "Is my data safe?",
          answer: "Placeholder answer — replace with the real copy.",
        },
        {
          question: "What if I need more time?",
          answer: "Placeholder answer — replace with the real copy.",
        },
        {
          question: "Can the lawyer represent me in court?",
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
          { label: "How it works", href: "#how-it-works" },
          { label: "Legal Categories", href: "#categories" },
          { label: "Why Ask My lawyer", href: "#why" },
          { label: "App Link", href: "#app" },
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
