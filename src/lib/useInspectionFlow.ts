import { useQuery } from "@tanstack/react-query";
import { getInspection, listImages, signedUrls } from "@/lib/inspections";
import { getTemplate } from "@/lib/flow";

/** Shared data for every /flow/$id step. */
export function useInspectionFlow(id: string, opts: { poll?: boolean } = {}) {
  const inspection = useQuery({ queryKey: ["inspection", id], queryFn: () => getInspection(id) });
  const images = useQuery({
    queryKey: ["inspection-images", id],
    queryFn: () => listImages(id),
    refetchInterval: opts.poll ? 4000 : false,
  });
  const rows = images.data ?? [];
  const urls = useQuery({
    queryKey: ["inspection-thumbs", id, rows.map((r) => r.storage_path).join(",")],
    queryFn: () => signedUrls(rows.map((r) => r.storage_path)),
    enabled: rows.length > 0,
    staleTime: 30 * 60 * 1000,
  });
  const template = useQuery({
    queryKey: ["template", inspection.data?.template_id],
    queryFn: () => getTemplate(inspection.data?.template_id),
    enabled: !!inspection.data,
  });
  return { inspection, images, rows, urls: urls.data ?? {}, template: template.data ?? null };
}
