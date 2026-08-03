import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card.js";
import { Progress } from "../../../shared/ui/progress.js";

export function UploadProgressCard({ fileName, percent }: { fileName: string; percent: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate">Subiendo: {fileName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Progress value={percent} />
        <p className="text-xs text-muted-foreground">{percent}%</p>
      </CardContent>
    </Card>
  );
}
