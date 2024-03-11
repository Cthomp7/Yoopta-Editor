import { useRef, useState } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

function YouTube({ embedId, ...other }) {
  const youtubeRootRef = useRef(null);
  const [isFrameLoaded, setFrameLoaded] = useState(false);

  const { isIntersecting: isInViewport } = useIntersectionObserver(youtubeRootRef, {
    freezeOnceVisible: true,
    rootMargin: '50%',
  });

  return (
    <div ref={youtubeRootRef} className="yoo-video-relative">
      <img
        src={`https://i.ytimg.com/vi/${embedId}/default.jpg`}
        alt="youtube_embed_preview"
        width="100%"
        height="100%"
        className="yoo-video-absolute yoo-video-top-0 yoo-video-left-0 yoo-video-w-full yoo-video-h-full"
        style={{
          opacity: isInViewport && isFrameLoaded ? 0 : 1,
          zIndex: isInViewport && isFrameLoaded ? -1 : 0,
        }}
      />
      {isInViewport && (
        <iframe
          title="Embed Player"
          // https://developers.google.com/youtube/player_parameters?hl=en
          src={`https://www.youtube.com/embed/${embedId}`}
          frameBorder={0}
          onLoad={() => setFrameLoaded(true)}
          allowFullScreen
          className="yoo-video-absolute yoo-video-top-0 yoo-video-left-0"
          {...other}
        />
      )}
    </div>
  );
}

export { YouTube };
