export function getYouTubeVideoIdFromUrl(url: string): string | null {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:(?:watch\?v=|embed\/|v\/)|shorts\/)?([\w-]{11})(?:[?&].+)?/;

  const match = url.match(regex);

  if (match && match[1]) {
    return match[1];
  }

  return null;
}
