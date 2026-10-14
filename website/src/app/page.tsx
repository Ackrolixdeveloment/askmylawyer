import type { Metadata } from "next";
import { SectionRenderer } from "@/components/sections/section-renderer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { customerPage } from "@/content/customer-page";
import { navItems, visibleSections } from "@/content/types";

export const metadata: Metadata = {
  title: customerPage.seo.title,
  description: customerPage.seo.description,
};

export default function CustomerLandingPage() {
  // Local for now; later this becomes `await fetchPage("customer")` and
  // nothing below it changes.
  const page = customerPage;

  return (
    <>
      <SiteHeader
        items={navItems(page)}
        homeHref="/"
        contact={{ label: "Contact us", href: "#contact" }}
      />

      <main>
        {visibleSections(page).map((section) => (
          <SectionRenderer key={section.anchor} section={section} />
        ))}
      </main>

      <SiteFooter footer={page.footer} />
    </>
  );
}
