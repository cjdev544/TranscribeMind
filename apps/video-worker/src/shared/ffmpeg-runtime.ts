import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffprobeInstaller from "@ffprobe-installer/ffprobe";

// fluent-ffmpeg shells out to system binaries; point it at the prebuilt
// binaries bundled by these installer packages instead of relying on the
// host having ffmpeg/ffprobe on PATH (it doesn't, on a bare Windows box).
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);
