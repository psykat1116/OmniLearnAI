import { useState } from 'react';
import type { StudyGuide, Recommendations } from '../types';

interface StudyGuideTabProps {
  studyGuide: StudyGuide;
  recommendations: Recommendations;
}

export function StudyGuideTab({ studyGuide, recommendations }: StudyGuideTabProps) {
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => ({ ...prev, [topic]: !prev[topic] }));
  };

  const recommendationEntries = Object.entries(recommendations).filter(([, links]) => links.length > 0);
  const hasRecommendations = recommendationEntries.length > 0;

  return (
    <div className="flex gap-6 min-h-0">
      <div className="flex-[2] flex flex-col gap-5 min-w-0">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-slate-900 font-semibold text-base mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Content Summary
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
            {studyGuide.summary}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-slate-900 font-semibold text-base mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-violet-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            Core Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {studyGuide.topics.map((topic) => (
              <span
                key={topic}
                className="bg-violet-50 border border-violet-200 text-violet-700 rounded-full px-3 py-1 text-sm font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <h2 className="text-slate-900 font-semibold text-base flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          Expand Your Knowledge
        </h2>

        {!hasRecommendations ? (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-slate-400 text-sm">No recommendations available.</p>
          </div>
        ) : (
          recommendationEntries.map(([topic, links]) => (
            <div
              key={topic}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() => toggleTopic(topic)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-slate-800 text-sm font-medium truncate pr-2">{topic}</span>
                <svg
                  className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                    expandedTopics[topic] ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedTopics[topic] && (
                <div className="border-t border-slate-100 px-4 py-3 flex flex-col gap-2.5 bg-slate-50">
                  {links.map((link, i) => (
                    <a
                      key={i}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2 text-violet-600 hover:text-violet-800 transition-colors group"
                    >
                      <svg
                        className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span className="text-xs leading-relaxed group-hover:underline">{link.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
