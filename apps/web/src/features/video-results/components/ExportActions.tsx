import { useState } from "react";
import { Copy, Download, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "../../../shared/ui/button.js";
import type { Video } from "../../../shared/types/video.js";

function buildReportText(video: Video): string {
  const lines = [`# ${video.title ?? video.originalFilename}`, ""];

  if (video.analysis) {
    lines.push("## Resumen ejecutivo", video.analysis.executiveSummary, "");
    lines.push("## Puntos clave", ...video.analysis.keyPoints.map((point) => `- ${point}`), "");
    lines.push("## Keywords", video.analysis.keywords.join(", "), "");
  }

  lines.push("## Transcripción", video.transcript ?? "");
  return lines.join("\n");
}

export function ExportActions({ video }: { video: Video }) {
  const [copied, setCopied] = useState(false);
  const fileBaseName = video.title ?? video.originalFilename;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildReportText(video));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([buildReportText(video)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileBaseName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const text = buildReportText(video);
    const lines: string[] = doc.splitTextToSize(text, 180);

    const topMargin = 15;
    const bottomMargin = 15;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.getHeight();

    let y = topMargin;
    for (const line of lines) {
      if (y > pageHeight - bottomMargin) {
        doc.addPage();
        y = topMargin;
      }
      doc.text(line, 15, y);
      y += lineHeight;
    }

    doc.save(`${fileBaseName}.pdf`);
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" onClick={handleCopy}>
        <Copy className="h-3.5 w-3.5" />
        {copied ? "¡Copiado!" : "Copiar"}
      </Button>
      <Button size="sm" variant="outline" onClick={handleDownloadTxt}>
        <Download className="h-3.5 w-3.5" />
        .txt
      </Button>
      <Button size="sm" variant="outline" onClick={handleDownloadPdf}>
        <FileDown className="h-3.5 w-3.5" />
        .pdf
      </Button>
    </div>
  );
}
