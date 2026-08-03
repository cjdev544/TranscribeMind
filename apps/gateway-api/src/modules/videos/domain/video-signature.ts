/**
 * Sniffs the first bytes of an uploaded file to confirm it's an actual video
 * container, instead of trusting the client-supplied MIME type (easily wrong
 * or spoofed — e.g. a browser reporting "video/mp4" for a file it only
 * recognized by its .mp4 extension).
 */
export function isAppleDoubleFile(buffer: Buffer): boolean {
  // macOS resource-fork sidecar files (e.g. "._video.mp4"), created alongside
  // the real file when zipping/copying on a Mac. A common mis-upload when a
  // user picks the wrong file out of an extracted archive.
  return buffer.length >= 4 && buffer.readUInt32BE(0) === 0x00051607;
}

function isIsoBaseMediaFile(buffer: Buffer): boolean {
  // mp4 / mov / m4v / 3gp: an ftyp box at byte offset 4.
  return buffer.length >= 8 && buffer.toString("ascii", 4, 8) === "ftyp";
}

function isMatroskaOrWebm(buffer: Buffer): boolean {
  return buffer.length >= 4 && buffer.readUInt32BE(0) === 0x1a45dfa3;
}

function isAvi(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "AVI "
  );
}

function isFlv(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer.toString("ascii", 0, 3) === "FLV";
}

export function isRecognizedVideoContainer(buffer: Buffer): boolean {
  return isIsoBaseMediaFile(buffer) || isMatroskaOrWebm(buffer) || isAvi(buffer) || isFlv(buffer);
}
