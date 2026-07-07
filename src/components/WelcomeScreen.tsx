export function WelcomeScreen() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      title: 'Universal Ingestion',
      description:
        'PDFs, YouTube videos, audio files, images, ZIP archives, and Google Drive links all supported.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Smart Study Guide',
      description:
        'Automatically synthesizes content into a concise 3-paragraph summary with core topics and curated web recommendations.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      title: 'Dynamic Quizzes',
      description:
        'AI-generated multiple-choice questions (5–10) with instant batch scoring and detailed explanations for every answer.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      title: 'AI Tutor Chat',
      description:
        'Context-aware RAG chat that retains full conversation memory and grounds all answers strictly within your source material.',
    },
  ];

  const steps = [
    { step: '01', text: 'Select a content type from the dropdown in the sidebar' },
    { step: '02', text: 'Paste the URL of your educational material' },
    { step: '03', text: 'Click Fetch & Process and let the AI agent work' },
    { step: '04', text: 'Study, quiz yourself, and ask the tutor anything' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-12 py-16 max-w-4xl mx-auto w-full">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-full px-4 py-1.5 text-violet-700 text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse inline-block" />
          AI-Powered Learning
        </div>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-4">
          Transform Any Content Into
          <br />
          <span className="text-violet-600">a Learning Experience</span>
        </h1>
        <p className="text-slate-500 text-lg leading-relaxed max-w-2xl mx-auto">
          OmniLearn AI ingests educational content from any source and automatically
          generates structured study guides, interactive quizzes, and a context-aware AI tutor.
        </p>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-4 w-full mb-10">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-white border border-slate-200 rounded-xl p-5 hover:border-violet-300 hover:shadow-md transition-all group shadow-sm"
          >
            <div className="w-10 h-10 rounded-lg bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 mb-3 group-hover:bg-violet-100 transition-colors">
              {feature.icon}
            </div>
            <h3 className="text-slate-900 font-semibold text-base mb-1.5">{feature.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* How to get started */}
      <div className="w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-4">
          How to get started
        </p>
        <div className="grid grid-cols-2 gap-3">
          {steps.map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="text-violet-600 font-bold text-sm font-mono flex-shrink-0 mt-px">
                {step}
              </span>
              <span className="text-slate-500 text-sm leading-relaxed">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
