import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Youtube, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Music, 
  Video, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink,
  Share2,
  AlertCircle
} from 'lucide-react';
import { extractMedia, MediaInfo } from '../services/downloaderApi';

interface HomeProps {
  isDarkMode: boolean;
}

export default function Home({ isDarkMode }: HomeProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setMediaInfo(null);
    setCopiedLink(false);

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

  const handleCopyLink = (linkUrl: string) => {
    navigator.clipboard.writeText(linkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const resetForm = () => {
    setUrl('');
    setMediaInfo(null);
    setError(null);
  };

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
          Paste any YouTube, TikTok, Instagram, Twitter/X, or Facebook link for instant, high-speed MP4 & MP3 downloads.
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
          <span>Supported: Direct MP4 videos, MP3 audio, 1080p, 720p, 480p</span>
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
          <p className="text-sm text-zinc-500 font-medium">Resolving high-speed direct download links</p>
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
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Thumbnail Preview */}
                <div className="md:col-span-5 relative group overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md">
                  {mediaInfo.thumbnail || mediaInfo.coverImage ? (
                    <img 
                      src={mediaInfo.thumbnail || mediaInfo.coverImage} 
                      alt={mediaInfo.title || 'Media preview'}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-zinc-800 flex items-center justify-center">
                      <Video className="text-zinc-600" size={48} />
                    </div>
                  )}

                  {mediaInfo.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      {mediaInfo.duration}
                    </span>
                  )}
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

                  {/* Format Tabs (Video vs Audio) */}
                  <div className="flex gap-2 p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-6 max-w-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab('video')}
                      disabled={!mediaInfo.videoUrl && (!mediaInfo.qualities || mediaInfo.qualities.length === 0)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all ${
                        activeTab === 'video'
                          ? 'bg-brand text-white shadow-md shadow-brand/20'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Video size={14} />
                      <span>Video (MP4)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('audio')}
                      disabled={!mediaInfo.audioUrl && !mediaInfo.musicUrl}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition-all ${
                        activeTab === 'audio'
                          ? 'bg-brand text-white shadow-md shadow-brand/20'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Music size={14} />
                      <span>Audio (MP3)</span>
                    </button>
                  </div>

                  {/* Action Section */}
                  {activeTab === 'video' ? (
                    <div className="space-y-4">
                      {mediaInfo.videoUrl ? (
                        <a
                          id="main-download-video-btn"
                          href={mediaInfo.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="w-full bg-brand hover:bg-red-600 text-white font-black uppercase tracking-widest py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/25 hover:scale-[1.01] active:scale-95"
                        >
                          <Download size={20} />
                          <span>Download Video (High Quality)</span>
                        </a>
                      ) : (
                        <p className="text-sm text-amber-500 font-semibold">Video stream available below via quality options.</p>
                      )}

                      {/* Quality Variants list if available */}
                      {mediaInfo.qualities && mediaInfo.qualities.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-2">
                            Select Quality Variant:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {mediaInfo.qualities.map((q, idx) => (
                              <a
                                key={idx}
                                href={q.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className={`py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all flex items-center justify-between ${
                                  isDarkMode 
                                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200' 
                                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800'
                                }`}
                              >
                                <span>{q.quality || 'Standard'}</span>
                                <Download size={13} className="text-brand" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mediaInfo.audioUrl || mediaInfo.musicUrl ? (
                        <a
                          id="main-download-audio-btn"
                          href={mediaInfo.audioUrl || mediaInfo.musicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="w-full bg-brand hover:bg-red-600 text-white font-black uppercase tracking-widest py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-500/25 hover:scale-[1.01] active:scale-95"
                        >
                          <Music size={20} />
                          <span>Download Audio (MP3)</span>
                        </a>
                      ) : (
                        <p className="text-sm text-zinc-400">Audio-only stream is not available for this link.</p>
                      )}
                    </div>
                  )}

                  {/* Copy link or open direct */}
                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(activeTab === 'video' ? (mediaInfo.videoUrl || '') : (mediaInfo.audioUrl || ''))}
                      className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 inline-flex items-center gap-1.5 transition-colors"
                    >
                      {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copiedLink ? 'Direct Link Copied!' : 'Copy Direct Stream URL'}</span>
                    </button>

                    <span className="text-zinc-400">•</span>

                    <a
                      href={activeTab === 'video' ? mediaInfo.videoUrl : (mediaInfo.audioUrl || mediaInfo.videoUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-zinc-500 hover:text-brand inline-flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink size={14} />
                      <span>Open in Browser</span>
                    </a>
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
                title: "Ultra-Fast API", 
                text: "Extract direct MP4 video and MP3 audio streams in seconds with no wait times." 
              },
              { 
                icon: ShieldCheck, 
                title: "100% Free & No Ads", 
                text: "Clean, direct downloading experience with zero interstitial ads or redirects." 
              },
              { 
                icon: Share2, 
                title: "All Platforms", 
                text: "Full support for YouTube, TikTok without watermark, Instagram Reels, and Twitter." 
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
    </main>
  );
}
