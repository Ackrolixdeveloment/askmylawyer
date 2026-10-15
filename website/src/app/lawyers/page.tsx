import type { Metadata } from "next";
import { SectionRenderer } from "@/components/sections/section-renderer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { lawyerPage } from "@/content/lawyer-page";
import { navItems, visibleSections } from "@/content/types";

export const metadata: Metadata = {
  title: lawyerPage.seo.title,
  description: lawyerPage.seo.description,
};

export default function LawyerLandingPage() {
  // Local for now; later this becomes `await fetchPage("lawyer")` and
  // nothing below it changes.
  const page = lawyerPage;

  return (
    <>
      <SiteHeader
        items={navItems(page)}
        homeHref="/lawyers"
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
