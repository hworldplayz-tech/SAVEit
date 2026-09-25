import { useState, FormEvent, useMemo, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Zap, 
  ArrowRight, 
  Loader2, 
  Music, 
  Video, 
  CheckCircle2, 
  AlertCircle,
  Play,
  X,
  Image as ImageIcon,
  Eye,
  Sparkles,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { 
  extractMedia, 
  MediaInfo, 
  getPosterOptions, 
  downloadMediaDirectly,
  downloadPosterDirectly,
  copyToClipboard,
  PosterOption,
  EngineChoice
} from '../services/downloaderApi';

interface FastDownloadProps {
  isDarkMode: boolean;
}

export default function FastDownload({ isDarkMode }: FastDownloadProps) {
  const [url, setUrl] = useState('');
  const [submittedUrl, setSubmittedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'poster'>('video');

  // Preview & masked states
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewPoster, setPreviewPoster] = useState<PosterOption | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  // Engine selection state & copy link state
  const [selectedEngine, setSelectedEngine] = useState<EngineChoice>('auto');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopy = async (text: string, e?: MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(null), 1600);
    }
  };

  const fetchDownload = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setMedia(null);
    setIsPlayingPreview(false);
    setPreviewPoster(null);
    setSubmittedUrl(url.trim());

    try {
      const response = await extractMedia(url.trim(), selectedEngine);
      if (response && response.mediaInfo) {
        setMedia(response.mediaInfo);
        if (!response.mediaInfo.videoUrl && response.mediaInfo.audioUrl) {
          setActiveTab('audio');
        } else {
          setActiveTab('video');
        }
      } else {
        throw new Error('Could not extract media for this link.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during processing.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (sourceUrl: string | undefined, formatKey: string, fileExtension: string) => {
    if (!sourceUrl) return;
    setDownloadingFormat(formatKey);
    const baseName = media?.title || 'SAVEit-fast';
    downloadMediaDirectly(sourceUrl, `${baseName}.${fileExtension}`);
    setTimeout(() => {
      setDownloadingFormat(null);
    }, 1200);
  };

  const handlePosterDownload = async (posterUrl: string | undefined, formatKey: string) => {
    if (!posterUrl) return;
    setDownloadingFormat(formatKey);
    try {
      const baseName = media?.title || 'SAVEit-poster';
      await downloadPosterDirectly(posterUrl, `${baseName}.jpg`);
    } finally {
      setTimeout(() => {
        setDownloadingFormat(null);
      }, 1200);
    }
  };

  const posterOptions = useMemo(() => {
    if (!media) return [];
    return getPosterOptions(media, submittedUrl);
  }, [media, submittedUrl]);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 md:py-24">
      {/* Fast Theme Hero */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-[10px] font-black uppercase tracking-[2px] mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
          </span>
          SAVEit Fast Mode • Turbo Stream Engine
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9]">
          Fast <span className="text-brand">Download</span> <br /> 
          <span className={isDarkMode ? 'text-zinc-600' : 'text-zinc-300'}>Instant Stream Links.</span>
        </h1>
        <p className={`text-lg md:text-xl font-medium max-w-xl mx-auto ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Direct stream extraction with live video preview, multiple video qualities, and official HD poster downloads.
        </p>
      </div>

      {/* Pro Search Bar */}
      <div className="max-w-2xl mx-auto mb-20">
        {/* Engine Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
            Engine:
          </span>
          <button
            type="button"
            onClick={() => setSelectedEngine('auto')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedEngine === 'auto'
                ? 'bg-brand text-white shadow-md shadow-brand/20'
                : isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Zap size={13} />
            <span>Auto (F2 → F1 → Standard)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedEngine('f-engine-2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedEngine === 'f-engine-2'
                ? 'bg-brand text-white shadow-md shadow-brand/20'
                : isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <Sparkles size={13} className={selectedEngine === 'f-engine-2' ? 'text-yellow-200' : 'text-amber-400'} />
            <span>F-Engine 2 (AllDL)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedEngine('f-engine-1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedEngine === 'f-engine-1'
                ? 'bg-brand text-white shadow-md shadow-brand/20'
                : isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>F-Engine 1</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedEngine('standard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedEngine === 'standard'
                ? 'bg-brand text-white shadow-md shadow-brand/20'
                : isDarkMode ? 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-900'
            }`}
          >
            <span>Standard Engine</span>
          </button>
        </div>

        <form onSubmit={fetchDownload} className="relative group">
          <div className={`absolute -inset-1 bg-gradient-to-r from-brand to-red-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 ${isLoading ? 'opacity-0' : ''}`}></div>
          <div className={`relative flex flex-col md:flex-row gap-2 p-2.5 rounded-2xl ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border shadow-xl`}>
            <div className="flex-1 flex items-center px-4 gap-4">
              <Zap className="text-brand shrink-0" size={26} />
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste video link here..."
                disabled={isLoading}
                className="w-full bg-transparent py-3.5 text-xl font-bold placeholder:text-zinc-500 focus:outline-none"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading || !url.trim()}
              className="bg-brand hover:bg-red-600 text-white font-black uppercase tracking-widest py-4 px-10 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing</span>
                </>
              ) : (
                <>
                  <span>Fast Extract</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Result Area */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-12 rounded-[32px] border text-center ${isDarkMode ? 'border-zinc-800 bg-[#0c0c0c]' : 'border-zinc-100 bg-zinc-50'}`}
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Extracting Stream...</h3>
            <p className="text-zinc-500 font-medium uppercase text-sm tracking-widest font-mono">Fetching direct MP4, MP3 & poster assets</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-center font-bold flex items-center justify-center gap-3"
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </motion.div>
        )}

        {media && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-[32px] overflow-hidden border shadow-3xl ${isDarkMode ? 'border-zinc-800 bg-[#0c0c0c]' : 'border-zinc-100 bg-zinc-50 shadow-zinc-200/50'}`}
          >
            <div className={`px-8 py-5 flex flex-wrap items-center justify-between gap-3 border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <div className="flex flex-wrap items-center gap-2.5">
                <CheckCircle2 className="text-green-500 w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-[2px] opacity-50">Stream Extracted</span>
                {media.platform && (
                  <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand/10 text-brand">
                    {media.platform}
                  </div>
                )}
                {media.sourceEngine && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Sparkles size={10} />
                    <span>{media.sourceEngine}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-8 md:p-12 flex flex-col items-center">
              {/* Media Preview Player or Poster */}
              <div className="w-full max-w-lg mb-6">
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-700/50 shadow-lg">
                  {isPlayingPreview && media.videoUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video 
                        src={media.videoUrl} 
                        controls 
                        autoPlay 
                        playsInline
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setIsPlayingPreview(false)}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full h-full group">
                      {media.thumbnail || media.coverImage ? (
                        <img 
                          src={media.thumbnail || media.coverImage} 
                          alt={media.title || 'Preview'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                          <Video className="text-zinc-600" size={48} />
                        </div>
                      )}

                      {media.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setIsPlayingPreview(true)}
                          className="absolute inset-0 m-auto w-14 h-14 bg-brand/90 hover:bg-brand text-white rounded-full flex items-center justify-center shadow-xl shadow-red-500/40 hover:scale-110 active:scale-95 transition-all"
                        >
                          <Play size={22} className="ml-1 fill-white" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Preview controls under player */}
                <div className="flex justify-center gap-3 mt-3">
                  {media.videoUrl && (
                    <button
                      type="button"
                      onClick={() => setIsPlayingPreview(!isPlayingPreview)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                        isPlayingPreview 
                          ? 'bg-zinc-800 text-white border-zinc-700' 
                          : isDarkMode 
                            ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800' 
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {isPlayingPreview ? <X size={14} /> : <Play size={14} className="text-brand fill-brand" />}
                      <span>{isPlayingPreview ? 'Stop Preview' : 'Watch Preview'}</span>
                    </button>
                  )}

                  {posterOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPreviewPoster(posterOptions[0])}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                        isDarkMode 
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800' 
                          : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
                      }`}
                    >
                      <Eye size={14} />
                      <span>View Poster</span>
                    </button>
                  )}
                </div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-black mb-6 text-center tracking-tight leading-tight max-w-xl">
                {media.title || 'Untitled Media'}
              </h2>

              {/* Tabs for Fast View */}
              <div className="flex gap-2 p-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-900 mb-6 max-w-sm w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                    activeTab === 'video' ? 'bg-brand text-white shadow' : 'text-zinc-500'
                  }`}
                >
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audio')}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                    activeTab === 'audio' ? 'bg-brand text-white shadow' : 'text-zinc-500'
                  }`}
                >
                  Audio
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('poster')}
                  className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${
                    activeTab === 'poster' ? 'bg-brand text-white shadow' : 'text-zinc-500'
                  }`}
                >
                  Posters ({posterOptions.length})
                </button>
              </div>

              {/* Action content based on active tab */}
              <div className="w-full max-w-md mb-8">
                {activeTab === 'video' && (
                  <div className="space-y-4">
                    {media.videoUrl && (
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => handleDownload(media.videoUrl, 'fast-video', 'mp4')}
                          disabled={downloadingFormat === 'fast-video'}
                          className="flex-1 bg-brand hover:bg-red-600 text-white font-black uppercase tracking-[2px] py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-75"
                        >
                          {downloadingFormat === 'fast-video' ? (
                            <>
                              <RefreshCw size={18} className="animate-spin" />
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <Video size={18} />
                              <span>Download Video (MP4)</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(media.videoUrl!, e)}
                          className={`px-4 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                            copiedUrl === media.videoUrl
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : isDarkMode
                                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                                : 'bg-zinc-200 hover:bg-zinc-300 border-zinc-300 text-zinc-700'
                          }`}
                          title="Copy Direct Video Link"
                        >
                          {copiedUrl === media.videoUrl ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    )}

                    {/* Qualities if available */}
                    {media.qualities && media.qualities.length > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                            Quality Options:
                          </span>
                          <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">
                            {media.qualities.length} Resolutions
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {media.qualities.map((q, idx) => {
                            const isThisDownloading = downloadingFormat === `fast-q-${idx}`;
                            const isThisCopied = copiedUrl === q.url;

                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                                  isDarkMode 
                                    ? 'bg-zinc-900 border-zinc-800 text-white' 
                                    : 'bg-white border-zinc-200 text-zinc-900'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span>{q.quality || 'Standard'}</span>
                                    {q.tier && (
                                      <span className="text-[9px] px-1 py-0.5 rounded bg-brand/10 text-brand font-black">
                                        {q.tier}
                                      </span>
                                    )}
                                    {q.noWatermark && (
                                      <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-black">
                                        Clean
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-zinc-500 block mt-0.5">{q.container || 'MP4'}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopy(q.url, e)}
                                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                      isThisCopied
                                        ? 'bg-emerald-500 text-white border-emerald-600'
                                        : isDarkMode
                                          ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                                          : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-600'
                                    }`}
                                    title="Copy direct link"
                                  >
                                    {isThisCopied ? <Check size={13} /> : <Copy size={13} />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownload(q.url, `fast-q-${idx}`, (q.container || 'mp4').toLowerCase())}
                                    disabled={isThisDownloading}
                                    className="p-1.5 rounded-lg bg-brand hover:bg-red-600 text-white transition-all cursor-pointer shadow-sm active:scale-95"
                                    title="Download resolution"
                                  >
                                    {isThisDownloading ? (
                                      <CheckCircle2 size={13} className="animate-bounce" />
                                    ) : (
                                      <Download size={13} />
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
                  <div>
                    {(media.audioUrl || media.musicUrl) ? (
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => handleDownload(media.audioUrl || media.musicUrl, 'fast-audio', 'mp3')}
                          disabled={downloadingFormat === 'fast-audio'}
                          className={`flex-1 font-black uppercase tracking-[2px] py-4 rounded-xl flex items-center justify-center gap-2 border transition-all hover:scale-[1.01] active:scale-95 cursor-pointer disabled:opacity-75 ${
                            isDarkMode 
                              ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700' 
                              : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-zinc-300'
                          }`}
                        >
                          {downloadingFormat === 'fast-audio' ? (
                            <>
                              <RefreshCw size={18} className="animate-spin" />
                              <span>Downloading...</span>
                            </>
                          ) : (
                            <>
                              <Music size={18} />
                              <span>Download Audio (MP3)</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleCopy((media.audioUrl || media.musicUrl)!, e)}
                          className={`px-4 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                            copiedUrl === (media.audioUrl || media.musicUrl)
                              ? 'bg-emerald-500 text-white border-emerald-600'
                              : isDarkMode
                                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
                                : 'bg-zinc-200 hover:bg-zinc-300 border-zinc-300 text-zinc-700'
                          }`}
                          title="Copy Audio Link"
                        >
                          {copiedUrl === (media.audioUrl || media.musicUrl) ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400 text-center">Audio stream unavailable.</p>
                    )}
                  </div>
                )}

                {activeTab === 'poster' && (
                  <div className="space-y-3">
                    {posterOptions.map((poster, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img 
                            src={poster.url} 
                            alt={poster.label} 
                            className="w-12 h-8 object-cover rounded border border-zinc-700/50" 
                          />
                          <div>
                            <p className="text-xs font-bold leading-tight">{poster.label}</p>
                            <span className="text-[10px] text-zinc-500 font-mono">{poster.resolution}</span>
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPoster(poster)}
                            className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                            title="Preview"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePosterDownload(poster.url, `poster-${idx}`)}
                            className="px-3 py-2 rounded-lg bg-brand hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                          >
                            <Download size={13} />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <p className="text-[10px] font-black uppercase tracking-[2px] opacity-40 text-center">
                Powered by LinkShare • No Watermarks • Instant High Speed
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Poster Preview Modal */}
      <AnimatePresence>
        {previewPoster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewPoster(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`max-w-xl w-full rounded-2xl overflow-hidden border shadow-2xl ${
                isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div className="p-3.5 flex items-center justify-between border-b border-zinc-800">
                <span className="text-xs font-black">{previewPoster.label}</span>
                <button
                  type="button"
                  onClick={() => setPreviewPoster(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-3 bg-black flex justify-center">
                <img 
                  src={previewPoster.url} 
                  alt={previewPoster.label} 
                  className="max-h-[50vh] w-auto object-contain rounded" 
                />
              </div>
              <div className="p-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewPoster(null)}
                  className="px-3 py-1.5 text-xs font-bold text-zinc-400"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handlePosterDownload(previewPoster.url, 'modal-poster-fast')}
                  className="px-4 py-1.5 rounded-lg bg-brand hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Download</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
