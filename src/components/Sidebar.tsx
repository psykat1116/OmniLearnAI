import { useState } from 'react';
import {
  CONTENT_TYPES,
  UPLOADABLE_CONTENT_TYPES,
  UPLOAD_ACCEPT,
  type ContentType,
} from '../types';

interface SidebarProps {
  onProcess: (source: string | File, contentType: ContentType) => Promise<void>;
  isProcessing: boolean;
  error: string | null;
  hasContent: boolean;
}

type SourceMode = 'url' | 'upload';

const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  'PDF Document': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  'YouTube Video': (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  'Audio File': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  'Image': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  'ZIP Archive': (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
};

export function Sidebar({ onProcess, isProcessing, error, hasContent }: SidebarProps) {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sourceMode, setSourceMode] = useState<SourceMode>('url');
  const [contentType, setContentType] = useState<ContentType>('PDF Document');

  const canUpload = UPLOADABLE_CONTENT_TYPES.has(contentType);

  const handleContentTypeChange = (type: ContentType) => {
    setContentType(type);
    if (!UPLOADABLE_CONTENT_TYPES.has(type)) {
      setSourceMode('url');
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceMode === 'upload' && canUpload) {
      if (!file) return;
      await onProcess(file, contentType);
    } else {
      if (!url.trim()) return;
      await onProcess(url.trim(), contentType);
    }
  };

  return (
    <aside className="w-72 min-h-screen bg-white border-r border-slate-200 flex flex-col flex-shrink-0 shadow-sm">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-slate-900 font-bold text-lg leading-none">OmniLearn AI</h1>
            <p className="text-slate-400 text-xs mt-0.5">Multimodal Learning Assistant</p>
          </div>
        </div>
      </div>

      {/* Data Ingestion Form */}
      <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5 flex-1">
        <div>
          <label className="block text-slate-700 text-sm font-medium mb-2">
            Content Type
          </label>
          <div className="relative">
            <select
              value={contentType}
              onChange={(e) => handleContentTypeChange(e.target.value as ContentType)}
              disabled={isProcessing}
              className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg px-3 py-2.5 text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed pr-10 shadow-sm"
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-slate-400">
            {contentTypeIcons[contentType]}
            <span className="text-xs">{contentType} selected</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-slate-700 text-sm font-medium">
              {sourceMode === 'upload' ? 'Upload File' : 'Source URL'}
            </label>
            {canUpload && (
              <div className="flex bg-slate-100 rounded-md p-0.5 text-xs">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setSourceMode('url')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors disabled:cursor-not-allowed ${
                    sourceMode === 'url'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  URL
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setSourceMode('upload')}
                  className={`px-2.5 py-1 rounded cursor-pointer transition-colors disabled:cursor-not-allowed ${
                    sourceMode === 'upload'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Upload
                </button>
              </div>
            )}
          </div>

          {sourceMode === 'upload' && canUpload ? (
            <>
              <input
                key={contentType}
                type="file"
                accept={UPLOAD_ACCEPT[contentType]}
                disabled={isProcessing}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full bg-white border border-slate-300 text-slate-600 rounded-lg text-sm file:mr-3 file:py-2.5 file:px-3 file:border-0 file:bg-slate-100 file:text-slate-700 file:text-sm file:font-medium file:cursor-pointer hover:file:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              />
              <p className="mt-1.5 text-slate-400 text-xs leading-relaxed">
                {file ? file.name : `Choose a ${contentType.toLowerCase()} from your device`}
              </p>
            </>
          ) : (
            <>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                disabled={isProcessing}
                required
                className="w-full bg-white border border-slate-300 text-slate-800 placeholder-slate-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              />
              <p className="mt-1.5 text-slate-400 text-xs leading-relaxed">
                Direct URL, YouTube link, or Google Drive link
              </p>
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={
            isProcessing ||
            (sourceMode === 'upload' && canUpload ? !file : !url.trim())
          }
          className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium rounded-lg py-2.5 px-4 text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shadow-sm"
        >
          {isProcessing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Fetch & Process
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 text-xs leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {hasContent && !error && !isProcessing && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-700 text-xs">Content processed successfully</p>
            </div>
          </div>
        )}
      </form>

      <div className="px-6 py-4 border-t border-slate-200">
        <p className="text-slate-400 text-xs text-center">Powered by Gemini &amp; LangGraph</p>
      </div>
    </aside>
  );
}
