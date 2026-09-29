import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Card, IconButton, ImageCard } from "@/design-system/gentle-code-library-71de11";
import type { PhotoPair } from "@/lib/flow";
import type { InspectionImage } from "@/lib/inspections";

type Severity = "normal" | "minor" | "moderate" | "defective" | "critical";

/** Thermal + visual photos of one spot side by side, with optional content below. */
export function PairCard({
  pair,
  urls,
  onRemove,
  children,
}: {
  pair: PhotoPair;
  urls: Record<string, string>;
  onRemove?: (img: InspectionImage) => void;
  children?: ReactNode;
}) {
  const photos = [pair.thermal, pair.visual].filter(Boolean) as InspectionImage[];
  return (
    <Card className="app-stack">
      <div className="app-pair">
        {photos.map((img) => (
          <ImageCard
            key={img.id}
            src={urls[img.storage_path] || undefined}
            alt={`${img.kind === "thermal" ? "Thermal" : "Visual"} photo ${img.filename}`}
            filename={img.filename}
            kind={img.kind === "thermal" ? "thermal" : "visual"}
            severity={(img.severity ?? undefined) as Severity | undefined}
            actions={
              onRemove ? (
                <IconButton label={`Remove ${img.filename}`} size="sm" variant="ghost" icon={<Trash2 />} onClick={() => onRemove(img)} />
              ) : undefined
            }
            onClick={() => urls[img.storage_path] && window.open(urls[img.storage_path], "_blank", "noopener")}
          />
        ))}
      </div>
      {children}
    </Card>
  );
}
