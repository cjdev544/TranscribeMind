import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_SUMMARY_LANGUAGE, type SummaryLanguage } from "@transcribemind/contracts";
import { DropzoneArea } from "./components/DropzoneArea.js";
import { UploadProgressCard } from "./components/UploadProgressCard.js";
import { ProcessingStepsCard } from "./components/ProcessingStepsCard.js";
import { UrlUploadForm } from "./components/UrlUploadForm.js";
import { LanguageSelect } from "./components/LanguageSelect.js";
import { Input } from "../../shared/ui/input.js";
import { useUploadVideo } from "./api/use-upload-video.js";
import { useRealtimeStore } from "../../stores/use-realtime-store.js";
import { VideoStatusValues } from "../../shared/types/video.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../shared/ui/tabs.js";

export function UploadPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [percent, setPercent] = useState(0);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [summaryLanguage, setSummaryLanguage] = useState<SummaryLanguage>(DEFAULT_SUMMARY_LANGUAGE);
  const [title, setTitle] = useState("");
  const upload = useUploadVideo(setPercent);
  const navigate = useNavigate();
  const realtimeStatus = useRealtimeStore((state) =>
    uploadedVideoId ? state.byVideoId[uploadedVideoId]?.status : undefined,
  );
  const realtimeProgress = useRealtimeStore((state) =>
    uploadedVideoId ? state.byVideoId[uploadedVideoId]?.progress : undefined,
  );

  const handleDrop = (file: File) => {
    setFileName(file.name);
    setPercent(0);
    upload.mutate(
      { file, title, summaryLanguage },
      { onSuccess: (result) => setUploadedVideoId(result.id) },
    );
  };

  const handleRetry = () => {
    setFileName(null);
    setPercent(0);
    upload.reset();
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 p-4 sm:p-6">
      <h1 className="text-lg font-semibold">Subir video</h1>

      {!fileName && !uploadedVideoId && (
        <div className="flex flex-col gap-3">
          <LanguageSelect value={summaryLanguage} onChange={setSummaryLanguage} />
          <Input
            type="text"
            placeholder="Nombre del video (opcional)"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
          />
          <Tabs defaultValue="file">
            <TabsList>
              <TabsTrigger value="file">Archivo</TabsTrigger>
              <TabsTrigger value="url">Enlace</TabsTrigger>
            </TabsList>
            <TabsContent value="file">
              <DropzoneArea onDrop={handleDrop} />
            </TabsContent>
            <TabsContent value="url">
              <UrlUploadForm title={title} summaryLanguage={summaryLanguage} onUploaded={setUploadedVideoId} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {fileName && !upload.isError && percent < 100 && <UploadProgressCard fileName={fileName} percent={percent} />}

      {upload.isError && (
        <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">
            {(upload.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              "No se pudo subir el video."}
          </p>
          <button className="text-sm text-primary hover:underline" onClick={handleRetry}>
            Intentar con otro archivo
          </button>
        </div>
      )}

      {uploadedVideoId && (
        <>
          <ProcessingStepsCard status={realtimeStatus ?? VideoStatusValues.QUEUED} progress={realtimeProgress} />
          <button
            className="text-sm text-primary hover:underline"
            onClick={() => navigate(`/dashboard?video=${uploadedVideoId}`)}
          >
            Ver detalles en el dashboard →
          </button>
        </>
      )}
    </div>
  );
}
