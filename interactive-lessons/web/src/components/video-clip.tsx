/** One lesson clip. Each scene is its own file, so the native controls show that scene's own duration and progress. */
export function VideoClip({ src, label, poster }: { src: string; label?: string; poster?: string }) {
  return (
    <figure className="video">
      <video src={src} poster={poster} controls preload="none" playsInline aria-label={label} />
    </figure>
  );
}
