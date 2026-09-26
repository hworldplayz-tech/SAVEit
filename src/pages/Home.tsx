import { useState, FormEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Youtube, 
  Zap, 
  ShieldCheck, 
  Music, 
  Video, 
  RefreshCw, 
  AlertCircle,
  Play,
  Image as ImageIcon,
  Eye,
  X,
  Sparkles,
  CheckCircle2,
  Radio,
  Layers
} from 'lucide-react';
import { 
  extractMedia, 
  MediaInfo, 
  getPosterOptions, 
  downloadMediaDirectly,
  downloadPosterDirectly,
  cleanMediaUrl,
  PosterOption,
  EngineChoice,
  deduplicateQualities
} from '../services/downloaderApi';

interface HomeProps {
  isDarkMode: boolean;
}

export default function Home({ isDarkMode }: HomeProps) {
  const [url, setUrl] = useState('');
  const [submittedUrl, setSubmittedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'poster'>('video');
  
  // Video preview player state
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  
  // Poster lightbox preview state
  const [previewPoster, setPreviewPoster] = useState<PosterOption | null>(null);

  // Download state for visual button feedback
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  // Engine selection state: 'auto' | 'f-engine-1' | 'standard'
  const [selectedEngine, setSelectedEngine] = useState<EngineChoice>('auto');

  // Paste button state
  const [isPasted, setIsPasted] = useState(false);

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        // Automatically clean URL to strip ?si=... tracking tokens
        setUrl(cleanMediaUrl(text));
        setIsPasted(true);
        setTimeout(() => setIsPasted(false), 1500);
      }
    } catch {
      // fallback
    }
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const clean = cleanMediaUrl(url);
    if (!clean) return;

    // Update input display to clean canonical URL
    setUrl(clean);

    setLoading(true);
    setError(null);
    setMediaInfo(null);
    setIsPlayingPreview(false);
    setPreviewPoster(null);
    setSubmittedUrl(clean);

    try {
      const response = await extractMedia(clean, selectedEngine);
      if (response && response.mediaInfo) {
        setMediaInfo(response.mediaInfo);
        if (!response.mediaInfo.videoUrl && response.mediaInfo.audioUrl) {
          setActiveTab('audio');
        } else {
          setActiveTab('video');
        }
      } else {
        throw new Error('No downloadable media was found for this link.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to extract media. Please verify the link and try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Triggers download immediately without delay, memory buffering, or popup blocking.
   */
  const handleDownloadAction = (sourceUrl: string | undefined, formatKey: string, fileExtension: string) => {
    if (!sourceUrl) return;

    setDownloadingFormat(formatKey);
    const baseName = mediaInfo?.title || 'SAVEit-media';
    const cleanFileName = `${baseName}.${fileExtension}`;
    downloadMediaDirectly(sourceUrl, cleanFileName);

    setTimeout(() => {
      setDownloadingFormat(null);
    }, 1200);
  };

  /**
   * Poster image download
   */
  const handlePosterDownload = async (posterUrl: string | undefined, formatKey: string) => {
    if (!posterUrl) return;
    setDownloadingFormat(formatKey);
    try {
      const baseName = mediaInfo?.title || 'SAVEit-poster';
      await downloadPosterDirectly(posterUrl, `${baseName}.jpg`);
    } finally {
      setTimeout(() => {
        setDownloadingFormat(null);
      }, 1200);
    }
  };

  const resetForm = () => {
    setUrl('');
    setSubmittedUrl('');
    setMediaInfo(null);
    setError(null);
    setIsPlayingPreview(false);
    setPreviewPoster(null);
  };

  // Compute available poster options
  const posterOptions = useMemo(() => {
    if (!mediaInfo) return [];
    return getPosterOptions(mediaInfo, submittedUrl);
  }, [mediaInfo, submittedUrl]);

  // Clean deduplicated video qualities
  const videoQualities = useMemo(() => {
    if (!mediaInfo || !mediaInfo.qualities) return [];
    const videos = mediaInfo.qualities.filter(q => q.type !== 'audio');
    return deduplicateQualities(videos);
  }, [mediaInfo]);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 md:py-20">
      
      {/* Professional Hero Section */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-[2px] mb-6 shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
          <span>SAVEit Pro • Multi-Engine Downloader</span>
        </motion.div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-4 font-sans leading-[1.05]">
          The Ultimate <br />
          <span className="text-brand">Media Downloader.</span>
        </h1>
        <p className={`text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Download high-resolution videos, lossless audio, and official posters from YouTube, TikTok, Instagram, and 40+ platforms without watermarks.
        </p>
      </div>

      {/* Engine Selection Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
          Engine:
        </span>
        <button
          type="button"
          onClick={() => setSelectedEngine('auto')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedEngine === 'auto'
              ? 'bg-brand text-white shadow-md shadow-brand/20'
              : isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900'
          }`}
          title="Auto Cascade (F-Engine 1 -> Standard)"
        >
          <Zap size={13} />
          <span>Auto (F1 → Standard)</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedEngine('f-engine-1')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedEngine === 'f-engine-1'
              ? 'bg-brand text-white shadow-md shadow-brand/20'
              : isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900'
          }`}
          title="Faizan Khichi Downloader Engine (1080p, 720p, Multi-Quality)"
        >
          <Sparkles size={13} className={selectedEngine === 'f-engine-1' ? 'text-yellow-200' : 'text-amber-400'} />
          <span>F-Engine 1 (FAK LABS Multi-Quality)</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedEngine('standard')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedEngine === 'standard'
              ? 'bg-brand text-white shadow-md shadow-brand/20'
              : isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900'
          }`}
          title="Standard Direct Stream Engine"
        >
          <span>Standard Engine</span>
        </button>
      </div>

      {/* Main Input Search Console */}
      <div className="max-w-3xl mx-auto mb-16">
        <form onSubmit={handleSubmit} className="relative group">
          <div className={`absolute -inset-1 bg-gradient-to-r from-brand to-red-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-700 ${loading ? 'opacity-0' : ''}`}></div>
          <div className={`relative flex flex-col sm:flex-row items-center gap-2 p-2.5 rounded-2xl border shadow-xl ${
            isDarkMode ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-zinc-200 shadow-zinc-200/50'
          }`}>
            <div className="flex-1 flex items-center px-3 w-full gap-3">
              <Youtube className="text-brand shrink-0" size={24} />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube, TikTok, Instagram, Twitter/X, or any media link..."
                required
                disabled={loading}
                className="w-full bg-transparent py-3 text-base sm:text-lg font-bold placeholder:text-zinc-400 placeholder:font-normal focus:outline-none"
              />
              <button
                type="button"
                onClick={handlePasteClick}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isPasted 
                    ? 'bg-emerald-500 text-white' 
                    : isDarkMode 
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' 
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                }`}
              >
                {isPasted ? '✓ Pasted' : '▣ Paste'}
              </button>
            </div>
            
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full sm:w-auto bg-brand hover:bg-red-600 text-white font-black uppercase tracking-widest py-3.5 px-8 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  <span>Resolving…</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Supported Platforms Tag Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
          <span>Supported:</span>
          {['YouTube', 'TikTok', 'Instagram', 'Twitter (X)', 'Pinterest', 'Facebook', 'Spotify', '40+ More'].map((p) => (
            <span 
              key={p} 
              className={`px-2 py-0.5 rounded-md border ${
                isDarkMode ? 'border-zinc-800 bg-zinc-900/60 text-zinc-400' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Loading state skeleton */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-2xl mx-auto mb-12 p-8 rounded-3xl border text-center ${
            isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200 shadow-md'
          }`}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand/10 text-brand mb-4">
            <RefreshCw className="animate-spin" size={26} />
          </div>
          <h3 className="text-xl font-black mb-1">Extracting Stream Media...</h3>
          <p className="text-sm text-zinc-500 font-medium">Resolving high-speed direct download links and HD posters</p>
        </motion.div>
      )}

      {/* Error state */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-12 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-4"
        >
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-sm mb-1">Extraction Notice</h4>
            <p className="text-xs text-red-500/90 leading-relaxed">{error}</p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="text-xs font-black underline hover:no-underline text-red-600 dark:text-red-400 cursor-pointer"
              >
                Retry Extraction
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
              >
                Try Another Link
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Output Console / Download Card */}
      <AnimatePresence mode="wait">
        {mediaInfo && !loading && (
          <motion.div
            key="media-result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-[32px] overflow-hidden border shadow-3xl mb-16 ${
              isDarkMode ? 'border-zinc-800 bg-[#0d0d0d]' : 'border-zinc-200 bg-white shadow-xl'
            }`}
          >
            {/* Header bar of result */}
            <div className={`px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3 border-b ${
              isDarkMode ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-zinc-100 bg-zinc-50/80'
            }`}>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[2px] text-emerald-500">
                  Ready to Download
                </span>
                {mediaInfo.platform && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand/10 text-brand uppercase">
                    {mediaInfo.platform}
                  </span>
                )}
                {mediaInfo.sourceEngine && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Sparkles size={10} />
                    {mediaInfo.sourceEngine}
                  </span>
                )}
              </div>
              
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-bold text-zinc-400 hover:text-brand flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>New Link</span>
              </button>
            </div>

            {/* Media Content Body */}
            <div className="p-6 sm:p-8 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Visual Preview / Video Player Container (Col 5) */}
                <div className="md:col-span-5 flex flex-col gap-3">
                  <div className="relative group overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md bg-black">
                    {isPlayingPreview && mediaInfo.videoUrl ? (
                      <div className="relative aspect-video w-full bg-black flex flex-col items-center justify-center">
                        <video 
                          src={mediaInfo.videoUrl} 
                          controls 
                          autoPlay 
                          playsInline
                          className="w-full h-full object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => setIsPlayingPreview(false)}
                          className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full transition-all cursor-pointer"
                          title="Close video preview"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative aspect-video w-full">
                        {mediaInfo.thumbnail || mediaInfo.coverImage ? (
                          <img 
                            src={mediaInfo.thumbnail || mediaInfo.coverImage} 
                            alt={mediaInfo.title || 'Media preview'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <Video className="text-zinc-600" size={48} />
                          </div>
                        )}

                        {/* Interactive Play Overlay Button */}
                        {mediaInfo.videoUrl && (
                          <button
                            type="button"
                            onClick={() => setIsPlayingPreview(true)}
                            className="absolute inset-0 m-auto w-14 h-14 bg-brand/90 hover:bg-brand text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all group-hover:opacity-100 cursor-pointer"
                            title="Preview video directly"
                          >
                            <Play size={22} className="ml-1 fill-white" />
                          </button>
                        )}

                        {mediaInfo.duration && (
                          <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                            {mediaInfo.duration}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Toggle Preview & Poster Actions */}
                  <div className="flex gap-2">
                    {mediaInfo.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isPlayingPreview
                            ? 'bg-zinc-800 text-white border-zinc-700'
                            : isDarkMode 
                              ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300' 
                              : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700'
                        }`}
                      >
                        {isPlayingPreview ? (
                          <>
                            <X size={14} />
                            <span>Stop Preview</span>
                          </>
                        ) : (
                          <>
                            <Play size={14} className="text-brand fill-brand" />
                            <span>Watch Preview</span>
                          </>
                        )}
                      </button>
                    )}

                    {posterOptions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPreviewPoster(posterOptions[0])}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isDarkMode 
                            ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300' 
                            : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700'
                        }`}
                        title="View Full Poster"
                      >
                        <Eye size={14} />
                        <span>Poster</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Info & Options (Col 7) */}
                <div className="md:col-span-7 flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black mb-2 tracking-tight line-clamp-2 leading-snug">
                      {mediaInfo.title || 'Untitled Media'}
                    </h2>
                    {mediaInfo.author || mediaInfo.authorName ? (
                      <p className="text-xs sm:text-sm font-semibold text-zinc-500 mb-4">
                        Creator: <span className={isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}>{mediaInfo.author || mediaInfo.authorName}</span>
                      </p>
                    ) : null}
                  </div>

                  {/* Format Navigation Tabs (Video, Audio, Poster) */}
                  <div className="flex gap-2 p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-6">
                    <button
                      type="button"
                      onClick={() => setActiveTab('video')}
                      disabled={!mediaInfo.videoUrl && videoQualities.length === 0}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        activeTab === 'video'
                          ? 'bg-brand text-white shadow-md shadow-brand/20'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Video size={14} />
                      <span>Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('audio')}
                      disabled={!mediaInfo.audioUrl && !mediaInfo.musicUrl}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        activeTab === 'audio'
                          ? 'bg-brand text-white shadow-md shadow-brand/20'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Music size={14} />
                      <span>Audio</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('poster')}
                      disabled={posterOptions.length === 0}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        activeTab === 'poster'
                          ? 'bg-brand text-white shadow-md shadow-brand/20'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <ImageIcon size={14} />
                      <span>Poster ({posterOptions.length})</span>
                    </button>
                  </div>

                  {/* Action Section based on Active Tab */}
                  {activeTab === 'video' && (
                    <div className="space-y-4">
                      {/* Primary Video Download Button (Full Width, No Copy Button for API Privacy) */}
                      {mediaInfo.videoUrl ? (
                        <div>
                          <button
                            id="main-download-video-btn"
                            type="button"
                            onClick={() => handleDownloadAction(mediaInfo.videoUrl, 'video-primary', 'mp4')}
                            className="w-full bg-brand hover:bg-red-600 text-white font-black uppercase tracking-widest py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/25 hover:scale-[1.01] active:scale-95 cursor-pointer"
                          >
                            {downloadingFormat === 'video-primary' ? (
                              <>
                                <CheckCircle2 size={20} className="text-white animate-bounce" />
                                <span>Starting Download...</span>
                              </>
                            ) : (
                              <>
                                <Download size={20} />
                                <span>Download Video (High Quality MP4)</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : null}

                      {/* Video Qualities Section (Direct Download Button only, No Copy Button) */}
                      {videoQualities.length > 0 && (
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                              Available Resolutions &amp; Qualities:
                            </span>
                            <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">
                              {videoQualities.length} {videoQualities.length === 1 ? 'Option' : 'Options'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {videoQualities.map((q, idx) => {
                              const qualityKey = `quality-${idx}-${q.quality}-${q.container || ''}`;
                              const isThisDownloading = downloadingFormat === qualityKey;

                              return (
                                <div
                                  key={idx}
                                  className={`p-3.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between group ${
                                    isDarkMode 
                                      ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-200' 
                                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800 shadow-sm'
                                  }`}
                                >
                                  <div className="min-w-0 pr-3">
                                    <div className="font-black text-sm flex items-center gap-1.5 flex-wrap">
                                      <span>{q.quality || 'Standard'}</span>
                                      {q.tier && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand/10 text-brand font-black tracking-wider uppercase">
                                          {q.tier}
                                        </span>
                                      )}
                                      {q.noWatermark && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-black">
                                          Clean
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium mt-0.5">
                                      <span>{q.container || 'MP4'} Video</span>
                                      {q.size && <span>• {typeof q.size === 'number' ? `${(q.size / (1024 * 1024)).toFixed(1)} MB` : q.size}</span>}
                                    </div>
                                  </div>

                                  <div className="shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadAction(q.downloadUrl || q.url, qualityKey, (q.container || 'mp4').toLowerCase())}
                                      className="p-2.5 rounded-xl bg-brand hover:bg-red-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-brand/20 active:scale-95"
                                      title="Download Format"
                                    >
                                      {isThisDownloading ? (
                                        <CheckCircle2 size={16} className="text-white animate-bounce" />
                                      ) : (
                                        <Download size={16} />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'audio' && (
                    <div className="space-y-4">
                      {mediaInfo.audioUrl || mediaInfo.musicUrl ? (
                        <div>
                          <button
                            id="main-download-audio-btn"
                            type="button"
                            onClick={() => handleDownloadAction(mediaInfo.audioUrl || mediaInfo.musicUrl, 'audio-primary', 'mp3')}
                            className="w-full bg-brand hover:bg-red-600 text-white font-black uppercase tracking-widest py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/25 hover:scale-[1.01] active:scale-95 cursor-pointer"
                          >
                            {downloadingFormat === 'audio-primary' ? (
                              <>
                                <CheckCircle2 size={20} className="text-white animate-bounce" />
                                <span>Starting Download...</span>
                              </>
                            ) : (
                              <>
                                <Music size={20} />
                                <span>Download Audio (MP3 320kbps)</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-400">Audio-only stream is not available for this specific link.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'poster' && (
                    <div className="space-y-3">
                      <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-1">
                        Download or Preview Official Poster / Cover Art:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {posterOptions.map((poster, idx) => {
                          const formatKey = `poster-${idx}`;
                          const isDownloading = downloadingFormat === formatKey;

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between group ${
                                isDarkMode 
                                  ? 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-200' 
                                  : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800 shadow-sm'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-black text-sm">{poster.label}</div>
                                <div className="text-[10px] text-zinc-500 font-medium">{poster.resolution} • JPG</div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewPoster(poster)}
                                  className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                                    isDarkMode 
                                      ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300' 
                                      : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-600'
                                  }`}
                                  title="View Full Poster"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePosterDownload(poster.url, formatKey)}
                                  className="p-2.5 rounded-xl bg-brand hover:bg-red-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shadow-brand/20 active:scale-95"
                                  title="Download Poster"
                                >
                                  {isDownloading ? (
                                    <CheckCircle2 size={16} className="text-white animate-bounce" />
                                  ) : (
                                    <Download size={16} />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Image Lightbox Modal */}
      <AnimatePresence>
        {previewPoster && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-3xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-black text-white">{previewPoster.label}</h3>
                  <span className="text-xs text-zinc-400">{previewPoster.resolution}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPoster(null)}
                  className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-hidden rounded-xl bg-black flex items-center justify-center">
                <img
                  src={previewPoster.url}
                  alt={previewPoster.label}
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewPoster(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handlePosterDownload(previewPoster.url, 'modal-poster')}
                  className="px-5 py-2.5 rounded-xl bg-brand hover:bg-red-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-500/25"
                >
                  <Download size={14} />
                  <span>Download Artwork</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Feature Value Props Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">
            <Radio size={20} />
          </div>
          <h4 className="font-bold text-sm mb-1.5">Faizan F-Engine 1 + Standard</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Automatic cascade between F-Engine 1 (FAK LABS 1080p/720p) and Standard Engine with seamless fallback.
          </p>
        </div>

        <div className={`p-6 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">
            <Layers size={20} />
          </div>
          <h4 className="font-bold text-sm mb-1.5">Strict Link Deduplication</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Eliminates duplicate quality links. Only real, unique resolutions and audio bitrates are presented.
          </p>
        </div>

        <div className={`p-6 rounded-2xl border transition-all ${
          isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">
            <Zap size={20} />
          </div>
          <h4 className="font-bold text-sm mb-1.5">Direct Stream Downloads</h4>
          <p className="text-xs text-zinc-500 leading-relaxed">
            High-speed native browser download manager with zero memory lag, fast stream resolution, and HD artwork.
          </p>
        </div>
      </div>

    </main>
  );
}
