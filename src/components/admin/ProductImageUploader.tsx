import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ProductImageUploaderProps {
  productId?: string;
  onImagesUploaded?: (imageUrls: string[]) => void;
  currentImages?: string[];
}

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  productId,
  onImagesUploaded,
  currentImages = []
}) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(currentImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      setUploading(true);
      const uploadedUrls: string[] = [];

      for (const file of validFiles) {
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
        const filePath = productId ? `products/${productId}/${fileName}` : `temp/${fileName}`;

        const { data, error } = await supabase.storage
          .from("rewards-products")
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from("rewards-products")
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }

      const newImageUrls = [...imageUrls, ...uploadedUrls];
      setImageUrls(newImageUrls);
      onImagesUploaded?.(newImageUrls);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);

    } catch (error: any) {
      toast.error(error.message || "Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    const newImageUrls = imageUrls.filter((_, index) => index !== indexToRemove);
    setImageUrls(newImageUrls);
    onImagesUploaded?.(newImageUrls);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Product Images</Label>
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            className="w-full h-32 border-dashed"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <span>{uploading ? "Uploading..." : "Upload Images"}</span>
            </div>
          </Button>
          
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              {imageUrls.map((url, index) => (
                <Card key={index} className="relative">
                  <CardContent className="p-2">
                    <img
                      src={url}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            handleFileSelect(files);
          }
        }}
        className="hidden"
      />
    </div>
  );
};

export default ProductImageUploader;