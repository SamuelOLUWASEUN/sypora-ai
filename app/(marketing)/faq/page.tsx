import type { Metadata } from "next";
import { FAQ } from "@/components/sections/FAQ";
import { CTA } from "@/components/sections/CTA";

export const metadata: Metadata = { title: "FAQ" };

export default function FAQPage() {
  return (
    <div className="pt-16">
      <div className="section pb-0">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="section-tag mx-auto">Help center</div>
            <h1 className="section-title">Frequently asked questions.</h1>
            <p className="section-sub mx-auto text-center">
              Everything you need to know about Sypora AI. Can't find what you're looking for?{" "}
              Reach out to our team and we'll get back to you fast.
            </p>
          </div>
        </div>
      </div>
      <FAQ />
      <CTA />
    </div>
  );
}
