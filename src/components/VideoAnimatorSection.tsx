import React, { useState, useRef } from 'react';
import {
  Film,
  Upload,
  Loader2,
  Download,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { IMAGES } from '../assets/images';

export const VideoAnimatorSection: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [prompt, setPrompt] = useState<string>(
    'Lightning crackles along the storm wolves fur while rain sweeps through the misty pine forest, slow cinematic camera push-in.'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setVideoSrc(null);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleUseSampleHero = async () => {
    setError(null);
    setVideoSrc(null);
    try {
      const resp = await fetch(IMAGES.hero);
      const blob = await resp.blob();
      setMimeType(blob.type || 'image/jpeg');
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
        setImageBase64(result);
      };
      reader.readAsDataURL(blob);
    } catch {
      setError('Could not load preset hero image.');
    }
  };

  const handleGenerateVideo = async () => {
    if (!imageBase64) {
      setError('Please upload a photo or load the preset Druid artwork first.');
      return;
    }

    setLoading(true);
    setError(null);
    setVideoSrc(null);

    try {
      const res = await fetch('/api/animate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          prompt,
          aspectRatio,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Video generation failed.');
      }
      if (data.videoBase64) {
        setVideoSrc(`data:${data.mimeType || 'video/mp4'};base64,${data.videoBase64}`);
      } else if (data.videoUri) {
        setVideoSrc(data.videoUri);
      } else {
        throw new Error('No playable video returned from server.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected video generation error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="video-studio" className="space-y-6">
      <div className="pb-4 border-b border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100 tracking-wide">
              Animate Photo Into Video
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Upload any Druid screenshot, gear card, or artwork and bring it to life in 16:9 or 9:16 motion.
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400 flex items-center gap-1.5 self-start sm:self-auto">
            <Film className="w-3.5 h-3.5" />
            <span>720p Motion Studio</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls & Upload */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-5">
          {/* Upload Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="uppercase tracking-wider text-stone-400 font-semibold">
                1. Source Image
              </span>
              <button
                type="button"
                onClick={handleUseSampleHero}
                className="text-amber-400 hover:text-amber-300 font-mono text-xs underline cursor-pointer"
              >
                Load Druid Hero Artwork
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-5 rounded-lg border border-dashed border-stone-700 hover:border-amber-500/70 bg-stone-950/70 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-6 h-6 text-amber-400" />
              <span className="text-sm font-medium text-stone-200">
                {previewUrl ? 'Replace Uploaded Photo' : 'Click to Upload Photo (PNG, JPG, WebP)'}
              </span>
              <span className="text-xs text-stone-500">
                Works with character screenshots, loot drops, or fantasy art
              </span>
            </button>
          </div>

          {/* Aspect Ratio Strict 16:9 or 9:16 */}
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold">
              2. Output Aspect Ratio
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(['16:9', '9:16'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-mono font-semibold border transition-colors cursor-pointer ${
                    aspectRatio === ratio
                      ? 'bg-amber-950/70 border-amber-500 text-amber-300'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {ratio === '16:9' ? '16:9 Landscape (Widescreen)' : '9:16 Portrait (Vertical)'}
                </button>
              ))}
            </div>
          </div>

          {/* Motion Prompt */}
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-stone-400 font-semibold">
              3. Motion & Camera Direction
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 rounded-lg bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-none text-sm text-stone-200 placeholder:text-stone-600"
              placeholder="Describe how the scene should animate..."
            />
          </div>

          {/* Generate CTA */}
          <button
            type="button"
            onClick={handleGenerateVideo}
            disabled={loading || !imageBase64}
            className="w-full py-3 px-5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Video (May Take 1-2 Minutes)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Animate Into {aspectRatio} Video</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-700/60 text-xs text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Preview & Result Player */}
        <div className="lg:col-span-6 p-5 rounded-xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between space-y-4">
          <div className="text-xs uppercase tracking-wider text-stone-400 font-semibold flex items-center justify-between">
            <span>{videoSrc ? 'Generated Video Output' : 'Image Preview'}</span>
            <span className="font-mono text-stone-500">{aspectRatio}</span>
          </div>

          <div className="flex-1 min-h-[280px] rounded-lg bg-stone-950 border border-stone-800 flex items-center justify-center overflow-hidden p-2">
            {videoSrc ? (
              <video
                src={videoSrc}
                controls
                autoPlay
                loop
                playsInline
                className={`rounded max-h-[380px] ${
                  aspectRatio === '9:16' ? 'aspect-[9/16] w-auto' : 'aspect-video w-full'
                } object-contain`}
              />
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Uploaded source preview"
                className="max-h-[360px] w-auto rounded object-contain"
              />
            ) : (
              <div className="text-center space-y-2 p-6 text-stone-500">
                <ImageIcon className="w-10 h-10 mx-auto text-stone-700" />
                <div className="text-xs font-mono">
                  Upload a photo on the left or click "Load Druid Hero Artwork" to preview.
                </div>
              </div>
            )}
          </div>

          {videoSrc && (
            <a
              href={videoSrc}
              download={`druid_companion_${aspectRatio.replace(':', 'x')}.mp4`}
              className="w-full py-2.5 px-4 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download MP4 Video</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
};
