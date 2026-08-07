import { useState, useCallback, useRef, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploaderProps {
  photos: string[];
  photoLimit: number;
  tier: string;
  onUploadFile: (data: { fileName: string; contentType: string; data: string }) => void;
  onUploadUrl: (url: string) => void;
  onRemove: (url: string) => void;
  isUploadingFile: boolean;
  isUploadingUrl: boolean;
  isRemoving: boolean;
  canEdit: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

export function PhotoUploader({
  photos,
  photoLimit,
  tier,
  onUploadFile,
  onUploadUrl,
  onRemove,
  isUploadingFile,
  isUploadingUrl,
  isRemoving,
  canEdit,
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const slotsRemaining = photoLimit - photos.length;
  const atLimit = slotsRemaining <= 0;

  const validateFile = useCallback((file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, and GIF images are allowed.");
      return false;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be under 5MB.");
      return false;
    }
    return true;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!validateFile(file)) return;
      setPendingFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [validateFile],
  );

  const handleConfirmUpload = useCallback(() => {
    if (!pendingFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (!base64) {
        toast.error("Failed to read image file.");
        return;
      }
      onUploadFile({
        fileName: pendingFile.name,
        contentType: pendingFile.type,
        data: base64,
      });
      setPendingFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    };
    reader.onerror = () => toast.error("Failed to read image file.");
    reader.readAsDataURL(pendingFile);
  }, [pendingFile, onUploadFile, previewUrl]);

  const handleCancelPreview = useCallback(() => {
    setPendingFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (atLimit || !canEdit) return;
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [atLimit, canEdit, handleFile],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUrlSubmit = useCallback(() => {
    if (!urlValue) return;
    onUploadUrl(urlValue);
    setUrlValue("");
    setShowUrlInput(false);
  }, [urlValue, onUploadUrl]);

  return (
    <div className="space-y-4">
      {/* Upload count */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          {photos.length} of {photoLimit} photos used
        </p>
        <span className="text-xs text-muted-foreground capitalize">{tier} plan</span>
      </div>

      {/* Drag-and-drop zone or preview */}
      {canEdit && !atLimit && (
        <>
          {previewUrl && pendingFile ? (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-lg border-2 border-primary/50 aspect-video bg-muted">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground px-3 py-1.5 text-xs font-medium flex items-center justify-between">
                  <span className="truncate max-w-[60%]">{pendingFile.name}</span>
                  <span>{(pendingFile.size / 1024).toFixed(0)} KB</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConfirmUpload} disabled={isUploadingFile} className="gap-1.5">
                  <Upload className="w-4 h-4" />
                  {isUploadingFile ? "Uploading..." : "Confirm Upload"}
                </Button>
                <Button variant="outline" onClick={handleCancelPreview} disabled={isUploadingFile}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isDragging ? "Drop your photo here" : "Drag photos here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or GIF — max 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}
        </>
      )}

      {/* At limit message */}
      {canEdit && atLimit && (
        <div className="p-4 rounded-lg border bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground">
            Photo limit reached ({photoLimit}). Remove a photo to add a new one, or upgrade your plan.
          </p>
        </div>
      )}

      {/* URL fallback */}
      {canEdit && !atLimit && (
        <div className="text-sm">
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Link2 className="w-3.5 h-3.5" />
            {showUrlInput ? "Hide URL input" : "Or add from URL"}
          </button>
          {showUrlInput && (
            <div className="flex gap-2 mt-2">
              <Input
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://your-site.com/photo.jpg"
                type="url"
              />
              <Button onClick={handleUrlSubmit} disabled={!urlValue || isUploadingUrl} size="sm">
                {isUploadingUrl ? "Adding..." : "Add"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Gallery grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((url) => (
            <div key={url} className="relative overflow-hidden rounded-lg border bg-muted aspect-video group">
              <img src={url} alt="Business gallery" className="w-full h-full object-cover" />
              {canEdit && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemove(url)}
                  disabled={isRemoving}
                  aria-label="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No owner-managed photos yet.</p>
      )}
    </div>
  );
}
