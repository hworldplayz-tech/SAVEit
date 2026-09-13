import { useState, FormEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Youtube, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Music, 
  Video, 
  RefreshCw, 
  Share2,
  AlertCircle,
  Play,
  Image as ImageIcon,
  Eye,
  X,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { 
  extractMedia, 
  MediaInfo, 
  getPosterOptions, 
  downloadSecurely,
  PosterOption 
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

  // Download in progress state for masked feedback
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setMediaInfo(null);
    setIsPlayingPreview(false);
    setPreviewPoster(null);
    setSubmittedUrl(url.trim());

    try {
      const response = await extractMedia(url.trim());
      if (response && response.mediaInfo) {
        setMediaInfo(response.mediaInfo);
        // Default to audio if no videoUrl is found
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

  const handleDownloadAction = async (sourceUrl: string | undefined, formatKey: string, fileExtension: string) => {
    if (!sourceUrl) return;
    setDownloadingFormat(formatKey);
    try {
      const baseName = mediaInfo?.title || 'SAVEit-media';
      const cleanFileName = `${baseName}.${fileExtension}`;
      await downloadSecurely(sourceUrl, cleanFileName);
    } finally {
      setTimeout(() => {
        setDownloadingFormat(null);
      }, 1500);
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

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 md:py-20">
      {/* Professional Hero */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-[2px] mb-6"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
          </span>
          SAVEit Media Engine 3.0 • Multi-Platform
        </motion.div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-5 tracking-tighter leading-[0.95]">
          Save Any Media <br /> 
          <span className={isDarkMode ? 'text-zinc-600' : 'text-zinc-300'}>Instant Direct Extraction.</span>
        </h1>

        <p className={`text-base sm:text-lg md:text-xl font-medium max-w-xl mx-auto ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Paste any YouTube, TikTok, Instagram, Twitter/X, or Facebook link for instant, high-speed MP4, MP3 & poster downloads.
        </p>

        {/* Platform tags */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {['YouTube', 'TikTok', 'Instagram', 'Twitter/X', 'Facebook', 'Vimeo'].map((p) => (
            <span
              key={p}
              className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                isDarkMode 
                  ? 'bg-zinc-900/80 border-zinc-800 text-zinc-400' 
                  : 'bg-zinc-100/80 border-zinc-200 text-zinc-600'
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Pro Search Bar */}
      <div className="max-w-2xl mx-auto mb-14">
        <form onSubmit={handleSubmit} className="relative group">
          <div className={`absolute -inset-1 bg-gradient-to-r from-brand to-red-600 rounded-2xl blur opacity-25 group-hover:opacity-45 transition duration-700 ${loading ? 'opacity-50 animate-pulse' : ''}`}></div>
          <div className={`relative flex flex-col md:flex-row gap-2 p-2.5 rounded-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border shadow-xl`}>
            <div className="flex-1 flex items-center px-4 gap-3">
              <Youtube className="text-brand shrink-0" size={24} />
              <input 
                id="video-url-input"
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste video link here (YouTube, TikTok, IG...)"
                disabled={loading}
                className="w-full bg-transparent py-3.5 text-base sm:text-lg font-bold placeholder:text-zinc-500 focus:outline-none"
              />
              {url && !loading && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-2 py-1"
                >
                  Clear
                </button>
              )}
            </div>
            <button 
              id="extract-btn"
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-brand hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest py-3.5 sm:py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-500/25 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Extract</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick helper tip */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 mt-3 px-2">
          <span>Supported: High-Res MP4, MP3 Audio, HD Posters & Qualities</span>
          <button
            type="button"
            onClick={() => setUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
            className="text-brand hover:underline font-bold transition-all"
          >
            Try sample URL
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
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
                onClick={handleSubmit}
                className="text-xs font-black underline hover:no-underline text-red-600 dark:text-red-400"
              >
                Retry Extraction
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Try Another Link
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Output Console / Download Card */}
      <AnimatePresence mode="wait">
        {mediaInfo && !loading ? (
          <motion.div
            key="media-result"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-[32px] overflow-hidden border shadow-3xl ${
              isDarkMode ? 'border-zinc-800 bg-[#0d0d0d]' : 'border-zinc-200 bg-white shadow-xl'
            }`}
          >
            {/* Header bar of result */}
            <div className={`px-6 sm:px-8 py-4 flex items-center justify-between border-b ${
              isDarkMode ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-zinc-100 bg-zinc-50/80'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-[2px] text-emerald-500">
                  Ready to Download
                </span>
                {mediaInfo.platform && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand/10 text-brand uppercase">
                    {mediaInfo.platform}
                  </span>
                )}
              </div>
              
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-bold text-zinc-400 hover:text-brand flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={12} />
                <span>New Link</span>
              </button>
            </div>

            {/* Media Content Body */}
            <div className="p-6 sm:p-8 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Visual Preview / Video Player Container */}
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
                          className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full transition-all"
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

                        {/* Interactive Play Overlay Button for Video Preview */}
                        {mediaInfo.videoUrl && (
                          <button
                            type="button"
                            onClick={() => setIsPlayingPreview(true)}
                            className="absolute inset-0 m-auto w-14 h-14 bg-brand/90 hover:bg-brand text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all group-hover:opacity-100"
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

                  {/* Toggle Preview / Full Poster Action underneath player */}
                  <div className="flex gap-2">
                    {mediaInfo.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
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
                        className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
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

                {/* Info & Options */}
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
                      disabled={!mediaInfo.videoUrl && (!mediaInfo.qualities || mediaInfo.qualities.length === 0)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all ${
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
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all ${
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
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all ${
                        activeTab === 'poster'
                          ? 'bg-brand text-white shadow-md shadow-brand/20'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <ImageIcon size={14} />
                      <span>Poster ({posterOptions.length})</span>
                    </button>
                  </div>

                  {/* Action Section */}
                  {activeTab === 'video' && (
                    <div className="space-y-4">
                      {/* Primary Video Download Button */}
                      {mediaInfo.videoUrl ? (
                        <button
                          id="main-download-video-btn"
                          type="button"
                          onClick={() => handleDownloadAction(mediaInfo.videoUrl, 'video-primary', 'mp4')}
                          disabled={downloadingFormat === 'video-primary'}
                          className="w-full bg-brand hover:bg-red-600 text-white font-black uppercase tracking-widest py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/25 hover:scale-[1.01] active:scale-95 disabled:opacity-75 cursor-pointer"
                        >
                          {downloadingFormat === 'video-primary' ? (
                            <>
                              <RefreshCw size={20} className="animate-spin" />
                              <span>Starting Download...</span>
                            </>
                          ) : (
                            <>
                              <Download size={20} />
                              <span>Download Video (High Quality MP4)</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <p className="text-sm text-amber-500 font-semibold">Video stream available below via quality options.</p>
                      )}

                      {/* Video Qualities Section if multiple options are available */}
                      {mediaInfo.qualities && mediaInfo.qualities.length > 0 && (
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                              Available Resolutions & Qualities:
                            </span>
                            <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">
                              {mediaInfo.qualities.length} Options
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {mediaInfo.qualities.map((q, idx) => {
                              const qualityKey = `quality-${idx}-${q.quality}`;
                              const isThisDownloading = downloadingFormat === qualityKey;

                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleDownloadAction(q.url, qualityKey, 'mp4')}
                                  disabled={isThisDownloading}
                                  className={`py-2.5 px-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                                    isDarkMode 
                                      ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200' 
                                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800'
                                  }`}
                                >
                                  <div>
                                    <div className="font-black text-sm flex items-center gap-1">
                                      <span>{q.quality || 'Standard'}</span>
                                      <Sparkles size={11} className="text-brand opacity-60" />
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-medium">MP4 Video</span>
                                  </div>

                                  <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                                    {isThisDownloading ? (
                                      <RefreshCw size={13} className="animate-spin" />
                                    ) : (
                                      <Download size={13} />
                                    )}
                                  </div>
                                </button>
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
                        <button
                          id="main-download-audio-btn"
                          type="button"
                          onClick={() => handleDownloadAction(mediaInfo.audioUrl || mediaInfo.musicUrl, 'audio-primary', 'mp3')}
                          disabled={downloadingFormat === 'audio-primary'}
                          className="w-full bg-brand hover:bg-red-600 text-white font-black uppercase tracking-widest py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/25 hover:scale-[1.01] active:scale-95 disabled:opacity-75 cursor-pointer"
                        >
                          {downloadingFormat === 'audio-primary' ? (
                            <>
                              <RefreshCw size={20} className="animate-spin" />
                              <span>Starting Download...</span>
                            </>
                          ) : (
                            <>
                              <Music size={20} />
                              <span>Download Audio (MP3 320kbps)</span>
                            </>
                          )}
                        </button>
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
                          const posterKey = `poster-${idx}`;
                          const isThisDownloading = downloadingFormat === posterKey;

                          return (
                            <div 
                              key={idx}
                              className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 ${
                                isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <img 
                                  src={poster.url} 
                                  alt={poster.label}
                                  className="w-14 h-10 object-cover rounded-lg border border-zinc-700/50 shrink-0" 
                                />
                                <div>
                                  <h4 className="text-xs font-black tracking-tight">{poster.label}</h4>
                                  <span className="text-[10px] text-zinc-500 font-mono">{poster.resolution}</span>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewPoster(poster)}
                                  className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                                    isDarkMode 
                                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700' 
                                      : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200'
                                  }`}
                                >
                                  <Eye size={13} />
                                  <span>Preview</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadAction(poster.url, posterKey, 'jpg')}
                                  disabled={isThisDownloading}
                                  className="flex-1 py-2 px-2.5 rounded-lg text-xs font-bold bg-brand hover:bg-red-600 text-white flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/20 transition-all cursor-pointer"
                                >
                                  {isThisDownloading ? (
                                    <RefreshCw size={13} className="animate-spin" />
                                  ) : (
                                    <Download size={13} />
                                  )}
                                  <span>Download</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer status notice */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] font-medium text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>Encrypted direct extraction stream</span>
                    </span>
                    <span className="font-mono text-[10px] uppercase">
                      LinkShare Protected
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Features Grid when idle */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { 
                icon: Zap, 
                title: "Live Video Preview", 
                text: "Watch and verify videos before downloading right inside our responsive player." 
              },
              { 
                icon: ShieldCheck, 
                title: "HD Poster Extraction", 
                text: "Download official 1080p YouTube posters and social media cover art in full resolution." 
              },
              { 
                icon: Share2, 
                title: "Multiple Qualities", 
                text: "Select your preferred resolution from 1080p, 720p, 480p, down to crystal-clear 320kbps MP3s." 
              }
            ].map((f, i) => (
              <div 
                key={i} 
                className={`p-8 rounded-3xl border transition-all ${
                  isDarkMode 
                    ? 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700' 
                    : 'bg-white border-zinc-100 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center mb-6">
                  <f.icon className="text-brand" size={24} />
                </div>
                <h3 className="text-xl font-black mb-3 tracking-tight">{f.title}</h3>
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500 font-medium'}`}>
                  {f.text}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Preview Modal Lightbox */}
      <AnimatePresence>
        {previewPoster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setPreviewPoster(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`max-w-2xl w-full rounded-3xl overflow-hidden border shadow-2xl ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div className={`p-4 flex items-center justify-between border-b ${
                isDarkMode ? 'border-zinc-800' : 'border-zinc-200'
              }`}>
                <div>
                  <h3 className="text-sm font-black">{previewPoster.label}</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">{previewPoster.resolution}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewPoster(null)}
                  className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 bg-black flex items-center justify-center">
                <img 
                  src={previewPoster.url} 
                  alt={previewPoster.label} 
                  className="max-h-[60vh] w-auto object-contain rounded-lg"
                />
              </div>

              <div className="p-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewPoster(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-300"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAction(previewPoster.url, 'modal-poster', 'jpg')}
                  className="bg-brand hover:bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-red-500/20"
                >
                  <Download size={14} />
                  <span>Download Image</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
