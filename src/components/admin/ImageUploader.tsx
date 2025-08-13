import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ImageRecord {
  id: string;
  product_id: string;
  url_full: string;
  url_card: string;
  url_thumb: string;
  alt: string | null;
  sort: number;
  created_at: string;
}

type Props = { productId: string };

function isValidType(type: string) {
  return ["image/jpeg", "image/png", "image/webp"].includes(type);
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawToCanvas(img: HTMLImageElement, maxDim: number) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  let { width, height } = img;
  const maxSide = Math.max(width, height);
  if (maxSide > maxDim) {
    const scale = maxDim / maxSide;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

async function canvasToBlob(canvas: HTMLCanvasElement, type = "image/webp", quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob"));
    }, type, quality);
  });
}

function pathFromPublicUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const marker = "/realtime/v1/"; // impossible; fallback in case of future changes
    const known = "/storage/v1/object/public/rewards-products/";
    const idx = u.pathname.indexOf(known);
    if (idx >= 0) return u.pathname.slice(idx + known.length);
    // fallback: try splitting by bucket name
    const parts = u.pathname.split("rewards-products/");
    if (parts.length > 1) return parts[1];
    return null;
  } catch {
    return null;
  }
}

const ImageUploader: React.FC<Props> = ({ productId }) => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: images, isLoading } = useQuery<ImageRecord[]>({
    queryKey: ["product-images", productId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("sort", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ImageRecord[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      let isFirst = !images || images.length === 0;
      for (const file of files) {
        if (!isValidType(file.type)) throw new Error("Invalid file type. Use JPG, PNG, or WEBP.");
        if (file.size > MAX_FILE_SIZE) throw new Error("File too large. Max 5MB.");

        const img = await fileToImage(file);
        // Generate 3 sizes
        const fullCanvas = drawToCanvas(img, 1600);
        const cardCanvas = drawToCanvas(img, 512);
        const thumbCanvas = drawToCanvas(img, 128);

        const [fullBlob, cardBlob, thumbBlob] = await Promise.all([
          canvasToBlob(fullCanvas),
          canvasToBlob(cardCanvas),
          canvasToBlob(thumbCanvas),
        ]);

        const base = `products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const fullPath = `${base}-full.webp`;
        const cardPath = `${base}-card.webp`;
        const thumbPath = `${base}-thumb.webp`;

        const bucket = (supabase as any).storage.from("rewards-products");

        // Upload files
        const { error: up1 } = await bucket.upload(fullPath, fullBlob, { contentType: "image/webp" });
        if (up1) throw up1;
        const { error: up2 } = await bucket.upload(cardPath, cardBlob, { contentType: "image/webp" });
        if (up2) throw up2;
        const { error: up3 } = await bucket.upload(thumbPath, thumbBlob, { contentType: "image/webp" });
        if (up3) throw up3;

        // Get public URLs
        const fullUrl = bucket.getPublicUrl(fullPath).data.publicUrl;
        const cardUrl = bucket.getPublicUrl(cardPath).data.publicUrl;
        const thumbUrl = bucket.getPublicUrl(thumbPath).data.publicUrl;

        // Insert DB row
        const nextSort = (images?.length ?? 0) + 1;
        const { error: insErr } = await (supabase as any)
          .from("product_images")
          .insert({
            product_id: productId,
            url_full: fullUrl,
            url_card: cardUrl,
            url_thumb: thumbUrl,
            sort: nextSort,
          });
        if (insErr) throw insErr;

        // If it's the first image for this product, set thumbnail on the product
        if (isFirst) {
          isFirst = false;
          await (supabase as any)
            .from("products")
            .update({ image_url: cardUrl })
            .eq("id", productId);
          // Invalidate product list too
          qc.invalidateQueries({ queryKey: ["admin-products"] });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-images", productId] });
      toast({ title: "Images uploaded" });
    },
    onError: (e: any) => toast({ title: "Upload failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (img: ImageRecord) => {
      const paths = [img.url_full, img.url_card, img.url_thumb]
        .map((u) => pathFromPublicUrl(u))
        .filter((p): p is string => Boolean(p));

      // Remove DB first (policies ensure admin only)
      const { error: delErr } = await (supabase as any)
        .from("product_images")
        .delete()
        .eq("id", img.id);
      if (delErr) throw delErr;

      // Try to remove storage objects (best-effort)
      if (paths.length) {
        await (supabase as any).storage.from("rewards-products").remove(paths);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-images", productId] });
      toast({ title: "Image removed" });
    },
    onError: (e: any) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    uploadMutation.mutate(files);
    e.currentTarget.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []).filter((f) => isValidType(f.type));
    if (files.length) uploadMutation.mutate(files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items
      .map((it) => (it.kind === "file" && it.type.startsWith("image/") ? it.getAsFile() : null))
      .filter((f): f is File => !!f);
    if (files.length) {
      uploadMutation.mutate(files);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaste={onPaste}
        tabIndex={0}
        role="button"
        aria-label="Upload product images by dropping, selecting, or pasting from clipboard"
        className="rounded-lg border border-dashed p-6 text-center bg-background/50"
      >
        <div className="mb-1 text-sm text-muted-foreground">Drag & drop images here (JPG, PNG, WEBP, max 5MB)</div>
        <div className="mb-3 text-[12px] text-muted-foreground">Tip: Paste images (Ctrl/Cmd+V)</div>
        <div className="flex justify-center">
          <label className="inline-flex items-center gap-2">
            <Button type="button" variant="secondary" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? "Uploading..." : "Select images"}
            </Button>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="sr-only"
              onChange={onInputChange}
            />
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading images...</div>
      ) : (images?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images!.map((img) => (
            <div key={img.id} className="rounded-md border overflow-hidden bg-card">
              <img src={img.url_thumb} alt={img.alt ?? "Product image thumbnail"} className="w-full h-28 object-cover" loading="lazy" />
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">sort {img.sort}</span>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(img)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No images yet. Upload your first image above.</div>
      ))}
    </div>
  );
};

export default ImageUploader;
