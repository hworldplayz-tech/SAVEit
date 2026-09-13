import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Zap, ArrowRight, Loader2, Music, Video, CheckCircle2, AlertCircle } from 'lucide-react';
import { extractMedia, MediaInfo } from '../services/downloaderApi';

interface FastDownloadProps {
  isDarkMode: boolean;
}

export default function FastDownload({ isDarkMode }: FastDownloadProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaInfo | null>(null);

  const fetchDownload = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setMedia(null);

    try {
      const response = await extractMedia(url.trim());
      if (response && response.mediaInfo) {
        setMedia(response.mediaInfo);
      } else {
        throw new Error('Could not extract media for this link.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during processing.');
    } finally {
      setIsLoading(false);
    }
  };

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
          SAVEit Fast Mode • No Key Required
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9]">
          Fast <span className="text-brand">Download</span> <br /> 
          <span className={isDarkMode ? 'text-zinc-600' : 'text-zinc-300'}>Instant Stream Links.</span>
        </h1>
        <p className={`text-lg md:text-xl font-medium max-w-xl mx-auto ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Direct stream extraction for maximum download speeds. Clean, zero ads, unlimited.
        </p>
      </div>

      {/* Pro Search Bar */}
      <div className="max-w-2xl mx-auto mb-20">
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
                  Processing
                </>
              ) : (
                <>
                  Fast Extract
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
            <p className="text-zinc-500 font-medium uppercase text-sm tracking-widest font-mono">Fetching direct MP4 & MP3 sources</p>
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
            <div className={`px-8 py-5 flex items-center justify-between border-b ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500 w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-[2px] opacity-50">Stream Extracted</span>
              </div>
              {media.platform && (
                <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand/10 text-brand">
                  {media.platform}
                </div>
              )}
            </div>
            
            <div className="p-8 md:p-12 flex flex-col items-center">
              {media.thumbnail || media.coverImage ? (
                <img 
                  src={media.thumbnail || media.coverImage} 
                  alt={media.title || 'Preview'} 
                  className="w-full max-w-md aspect-video object-cover rounded-2xl mb-8 shadow-md"
                />
              ) : null}
              
              <h2 className="text-xl md:text-2xl font-black mb-6 text-center tracking-tight leading-tight">
                {media.title || 'Untitled Media'}
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mb-8">
                {media.videoUrl && (
                  <a 
                    href={media.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex-1 bg-brand hover:bg-red-600 text-white font-black uppercase tracking-[2px] py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Video size={18} />
                    <span>Video (MP4)</span>
                  </a>
                )}

                {(media.audioUrl || media.musicUrl) && (
                  <a 
                    href={media.audioUrl || media.musicUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className={`flex-1 font-black uppercase tracking-[2px] py-4 rounded-xl flex items-center justify-center gap-2 border transition-all hover:scale-[1.02] active:scale-95 ${
                      isDarkMode 
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700' 
                        : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-zinc-300'
                    }`}
                  >
                    <Music size={18} />
                    <span>Audio (MP3)</span>
                  </a>
                )}
              </div>
              
              <p className="text-[10px] font-black uppercase tracking-[2px] opacity-40 text-center">
                Powered by LinkShare • No Watermarks • Instant High Speed
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
