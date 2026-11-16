'use client';

import { PosterFrame } from '@atelier/poster-frame';

/** 将随包 examples/posters 复制到宿主项目的 public/posters。 */
export default function Basic() {
  return (
    <PosterFrame
      posterSrc="/posters/poster-1.png"
      defaultFrame="walnut"
      defaultQuality="balanced"
      showControls
      onError={(error) => console.error('海报展框加载失败', error)}
      style={{ width: '100%', height: 600 }}
    />
  );
}
