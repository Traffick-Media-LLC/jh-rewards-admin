import React, { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Lightweight SEO helper (no external libs)
const useSEO = ({ title, description, canonical }: { title: string; description?: string; canonical?: string }) => {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", description);
    }
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }
  }, [title, description, canonical]);
};

const ThankYou: React.FC = () => {
  useSEO({
    title: "Thank You - Order Confirmed",
    description: "Order confirmed. Thank you for redeeming your rewards points.",
    canonical: `${window.location.origin}/thank-you`,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-12 flex-1">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Thank You for Your Order</h1>
        </header>

        <section className="max-w-2xl">
          <article className="rounded-none border bg-card p-6 sm:p-8">
            <p className="text-base text-muted-foreground mb-6">
              Your redemption was successful and is now being processed. You’ll receive an email with tracking details once your items ship.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <Link to="/shop">Continue Shopping</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/">Go to Home</Link>
              </Button>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYou;
