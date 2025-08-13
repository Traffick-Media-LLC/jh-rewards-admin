import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useCart } from "@/contexts/CartContext";
import { PRODUCTS } from "@/data/products";
import { VariantSelector } from "@/components/product/VariantSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProductVariant } from "@/pages/admin/AdminProducts";
import { formatPoints } from "@/lib/pricing";

// Local SEO helper
function useSEO({
  title,
  description,
  canonical
}: {
  title: string;
  description: string;
  canonical?: string;
}) {
  useEffect(() => {
    document.title = title;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = canonical || window.location.href;
  }, [title, description, canonical]);
}
const ProductPage: React.FC = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // First try to get from database, fallback to PRODUCTS
  const {
    data: dbProduct
  } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('products').select('*').eq('id', id).eq('active', true).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Fetch product images
  const {
    data: productImages
  } = useQuery({
    queryKey: ['product-images', id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('product_images').select('*').eq('product_id', id).order('sort', {
        ascending: true
      }).order('created_at', {
        ascending: true
      });
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });
  const product = useMemo(() => {
    if (dbProduct) {
      // Convert database product to expected format
      return {
        id: dbProduct.id,
        name: dbProduct.name,
        price: dbProduct.price_cents,
        salePrice: dbProduct.sale_price_cents || undefined,
        category: (dbProduct.category || "Other") as any,
        image: dbProduct.image_url || '/placeholder.svg',
        images: dbProduct.image_url ? [dbProduct.image_url] : [],
        description: dbProduct.description || "",
        hasVariants: dbProduct.has_variants || false,
        variantTypes: dbProduct.variant_types || []
      };
    }
    return PRODUCTS.find(p => p.id === Number(id));
  }, [id, dbProduct]);

  // Create images array prioritizing product_images table
  const images = useMemo(() => {
    if (productImages && productImages.length > 0) {
      // Use images from product_images table
      return productImages.map(img => img.url_full);
    } else if (product?.images && product.images.length > 0) {
      // Fallback to product.images
      return product.images;
    } else if (product?.image) {
      // Final fallback to main product image
      return [product.image];
    }
    return [];
  }, [productImages, product]);
  const {
    addItem,
    openCart
  } = useCart();
  useSEO({
    title: product ? `${product.name} | Juice Head Rewards` : 'Product | Juice Head Rewards',
    description: product ? `${product.name} available in the Juice Head Rewards shop.` : 'Product details in the Juice Head Rewards shop.',
    canonical: `${window.location.origin}/product/${id}`
  });

  // Structured data
  useEffect(() => {
    if (!product) return;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      image: images.length > 0 ? images : [product.image],
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock"
      }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [product, images]);
  if (!product) {
    return <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-foreground">Product not found</h1>
          <p className="text-muted-foreground mt-2">The product you are looking for does not exist.</p>
          <Button asChild className="mt-6">
            <Link to="/shop">Back to Shop</Link>
          </Button>
        </main>
        <Footer />
      </div>;
  }
  const activeImage = images[currentImageIndex];
  return <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <article className="grid grid-cols-1 lg:grid-cols-12 gap-10" aria-label="Product details">
          {/* Gallery */}
          <section className="lg:col-span-6 space-y-4" aria-label="Image gallery">
            <Card className="p-4">
              <AspectRatio ratio={1}>
                <img src={activeImage} alt={`${product.name} main image`} loading="eager" className="w-full h-full object-contain" />
              </AspectRatio>
            </Card>
            <div className="grid grid-cols-4 gap-3">
              {images.map((src, idx) => <button key={idx} onClick={() => setCurrentImageIndex(idx)} aria-label={`View image ${idx + 1}`} className={`border ${idx === currentImageIndex ? 'border-primary' : 'border-transparent'} rounded-md p-2 bg-card hover:border-primary/60 transition-colors`}>
                  <AspectRatio ratio={1}>
                    <img src={src} alt={`${product.name} thumbnail ${idx + 1}`} loading="lazy" className="w-full h-full object-contain" />
                  </AspectRatio>
                </button>)}
            </div>
          </section>

          {/* Details */}
          <section className="lg:col-span-6 space-y-6" aria-label="Product information">
            <header>
              <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
              <p className="text-muted-foreground mt-2">{product.description || 'Premium quality product available in our rewards shop.'}</p>
            </header>

            <div className="flex items-center gap-4">
              {"salePrice" in product && product.salePrice ? <div className="space-y-1">
                  <span className="text-xl text-muted-foreground line-through">{formatPoints(product.price)}</span>
                  <div className="text-2xl font-semibold text-destructive">{formatPoints(product.salePrice)}</div>
                </div> : <span className="text-2xl font-semibold text-foreground">{formatPoints(product.price)}</span>}
            </div>

            {/* Variant Selection */}
            {"hasVariants" in product && product.hasVariants && "variantTypes" in product && product.variantTypes && <VariantSelector productId={String(product.id)} variantTypes={product.variantTypes} onVariantSelect={(variant, selections) => {
            setSelectedVariant(variant);
            setSelectedVariants(selections);
          }} />}

            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-md">
                <Button type="button" variant="secondary" onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Decrease quantity" className="rounded-none">
                  −
                </Button>
                <div className="px-4 min-w-12 text-center select-none">{qty}</div>
                <Button type="button" variant="secondary" onClick={() => setQty(q => q + 1)} aria-label="Increase quantity" className="rounded-none">
                  +
                </Button>
              </div>

              <Button size="lg" aria-label={`Add ${product.name} to cart`} disabled={"hasVariants" in product && product.hasVariants && !selectedVariant} onClick={() => {
              if ("hasVariants" in product && product.hasVariants && selectedVariant) {
                addItem(product as any, qty, selectedVariant.id, selectedVariants);
              } else {
                addItem(product as any, qty);
              }
              openCart();
            }}>
                Add to Cart
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">Category: {product.category}</div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">Details</h2>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>High-quality selection</li>
                <li>Fast shipping</li>
                <li>Support available 7 days a week</li>
              </ul>
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </div>;
};
export default ProductPage;