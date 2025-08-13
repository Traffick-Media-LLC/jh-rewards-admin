import React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { isValidType, MAX_FILE_SIZE, fileToImage, drawToCanvas, canvasToBlob } from "@/lib/image";

export type StagedImage = {
  id: string;
  name: string;
  fullBlob: Blob;
  cardBlob: Blob;
  thumbBlob: Blob;
  previewUrl: string; // from thumb blob
};

type Props = {
  staged: StagedImage[];
  onChange: (next: StagedImage[]) => void;
};

const LocalImageUploader: React.FC<Props> = ({ staged, onChange }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    setIsProcessing(true);
    try {
      const additions: StagedImage[] = [];
      for (const file of files) {
        if (!isValidType(file.type)) {
          toast({ title: "Invalid file type", description: "Use JPG, PNG or WEBP", variant: "destructive" });
          continue;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast({ title: "File too large", description: "Max 5MB per image", variant: "destructive" });
          continue;
        }
        const img = await fileToImage(file);
        const fullCanvas = drawToCanvas(img, 1600);
        const cardCanvas = drawToCanvas(img, 512);
        const thumbCanvas = drawToCanvas(img, 128);
        const [fullBlob, cardBlob, thumbBlob] = await Promise.all([
          canvasToBlob(fullCanvas),
          canvasToBlob(cardCanvas),
          canvasToBlob(thumbCanvas),
        ]);
        const previewUrl = URL.createObjectURL(thumbBlob);
        additions.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          fullBlob,
          cardBlob,
          thumbBlob,
          previewUrl,
        });
      }
      if (additions.length) onChange([...staged, ...additions]);
    } catch (e: any) {
      toast({ title: "Processing failed", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    e.currentTarget.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    addFiles(files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData?.items || []);
    const files = items
      .map((it) => (it.kind === "file" && it.type.startsWith("image/") ? it.getAsFile() : null))
      .filter((f): f is File => !!f);
    if (files.length) addFiles(files);
  };

  const remove = (id: string) => {
    const next = staged.filter((s) => s.id !== id);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaste={onPaste}
        tabIndex={0}
        role="button"
        aria-label="Stage product images by dropping, selecting, or pasting from clipboard"
        className="rounded-lg border border-dashed p-6 text-center bg-background/50"
      >
        <div className="mb-1 text-sm text-muted-foreground">Drag & drop images here (JPG, PNG, WEBP, max 5MB)</div>
        <div className="mb-3 text-[12px] text-muted-foreground">These will upload when you click Create</div>
        <div className="flex justify-center">
          <label className="inline-flex items-center gap-2">
            <Button type="button" variant="secondary" disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Select images"}
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

      {staged.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {staged.map((img) => (
            <div key={img.id} className="rounded-md border overflow-hidden bg-card">
              <img src={img.previewUrl} alt={`Staged product image ${img.name}`} className="w-full h-28 object-cover" loading="lazy" />
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground truncate max-w-[120px]" title={img.name}>{img.name}</span>
                <Button size="sm" variant="destructive" onClick={() => remove(img.id)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No images staged yet.</div>
      )}
    </div>
  );
};

export default LocalImageUploader;
