import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { isValidType, MAX_FILE_SIZE, fileToImage, drawToCanvas, canvasToBlob } from "@/lib/image";

interface ProductImageUploaderProps {
  productId?: string;
  onImageUploaded?: (imageUrl: string) => void;
  currentImageUrl?: string;
  allowBackgroundRemoval?: boolean;
}

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  productId,
  onImageUploaded,
  currentImageUrl,
  allowBackgroundRemoval = true
}) => {
  const [uploading, setUploading] = useState(false);
  const [removingBackground, setRemovingBackground] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!isValidType(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Process image
      const img = await fileToImage(file);
      const canvas = drawToCanvas(img, 1024);
      const processedBlob = await canvasToBlob(canvas, "image/webp", 0.9);

      // Upload to Supabase Storage
      const fileName = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, ".webp")}`;
      const filePath = productId ? `products/${productId}/${fileName}` : `temp/${fileName}`;

      const { data, error } = await supabase.storage
        .from("rewards-products")
        .upload(filePath, processedBlob);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("rewards-products")
        .getPublicUrl(data.path);

      setPreviewUrl(publicUrl);
      onImageUploaded?.(publicUrl);
      toast.success("Image uploaded successfully");

    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
      setPreviewUrl(currentImageUrl || "");
    } finally {
      setUploading(false);
    }
  };

  const removeBackground = async () => {
    if (!previewUrl) return;

    try {
      setRemovingBackground(true);
      
      // Dynamically import the background removal function
      const { removeBackground, loadImage } = await import("@/lib/backgroundRemoval");
      
      // Load image from URL
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const img = await loadImage(blob);
      
      // Remove background
      const processedBlob = await removeBackground(img);
      
      // Upload processed image
      const fileName = `${Date.now()}-no-bg.png`;
      const filePath = productId ? `products/${productId}/${fileName}` : `temp/${fileName}`;

      const { data, error } = await supabase.storage
        .from("rewards-products")
        .upload(filePath, processedBlob);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("rewards-products")
        .getPublicUrl(data.path);

      setPreviewUrl(publicUrl);
      onImageUploaded?.(publicUrl);
      toast.success("Background removed successfully");

    } catch (error: any) {
      toast.error(error.message || "Failed to remove background");
    } finally {
      setRemovingBackground(false);
    }
  };

  const clearImage = () => {
    setPreviewUrl("");
    onImageUploaded?.("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Product Image</Label>
        <div className="mt-2">
          {previewUrl ? (
            <Card className="relative">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={previewUrl}
                      alt="Product preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Replace Image
                    </Button>
                    {allowBackgroundRemoval && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeBackground}
                        disabled={removingBackground}
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        {removingBackground ? "Removing..." : "Remove Background"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove Image
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full h-32 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <span>{uploading ? "Uploading..." : "Upload Product Image"}</span>
              </div>
            </Button>
          )}
        </div>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
        }}
        className="hidden"
      />
    </div>
  );
};

export default ProductImageUploader;