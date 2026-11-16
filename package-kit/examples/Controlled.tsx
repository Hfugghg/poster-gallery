'use client';

import { useEffect, useRef, useState } from 'react';
import { PosterFrame, frames, qualityPresets } from '@atelier/poster-frame';
import type { FrameId, PosterFrameHandle, QualityPreset, RenderSettings } from '@atelier/poster-frame';

export default function Controlled() {
  const viewer = useRef<PosterFrameHandle>(null);
  const [frame, setFrame] = useState<FrameId>('bronze');
  const [quality, setQuality] = useState<QualityPreset>('balanced');
  const [settings, setSettings] = useState<RenderSettings>({ ...qualityPresets[1].settings });
  const [warm, setWarm] = useState(true);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => () => { if (uploaded) URL.revokeObjectURL(uploaded); }, [uploaded]);

  async function download() {
    try {
      if (!viewer.current) return;
      const blob = await viewer.current.exportPng();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'poster-frame.png';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '导出失败');
    }
  }

  return (
    <section>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <label>
          边框{' '}
          <select value={frame} onChange={(event) => setFrame(event.target.value as FrameId)}>
            {frames.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>
          画质{' '}
          <select
            value={quality}
            onChange={(event) => {
              const preset = qualityPresets.find((item) => item.id === event.target.value);
              if (preset) {
                setQuality(preset.id as QualityPreset);
                setSettings({ ...preset.settings });
              }
            }}
          >
            {qualityPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={warm} onChange={(event) => setWarm(event.target.checked)} /> 暖光
        </label>
        <label>
          上传海报{' '}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
                setError('请选择不超过 20 MB 的 PNG、JPEG 或 WebP 图片。');
                event.target.value = '';
                return;
              }
              setError('');
              setUploaded(URL.createObjectURL(file));
              event.target.value = '';
            }}
          />
        </label>
        <button type="button" onClick={() => viewer.current?.resetView()}>重置视角</button>
        <button type="button" onClick={() => void download()}>导出 PNG</button>
      </div>
      {error && <p role="alert">{error}</p>}
      <PosterFrame
        ref={viewer}
        posterSrc={uploaded ?? '/posters/poster-1.png'}
        frame={frame}
        quality={quality}
        settings={settings}
        warm={warm}
        onFrameChange={setFrame}
        onQualityChange={setQuality}
        onSettingsChange={setSettings}
        onError={(cause) => setError(cause.message)}
        style={{ width: '100%', height: '70vh', minHeight: 400 }}
      />
    </section>
  );
}
