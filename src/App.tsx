import { useState, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { QuizTab } from "./components/QuizTab";
import { ChatTab } from "./components/ChatTab";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { StudyGuideTab } from "./components/StudyGuideTab";

import type {
  TabId,
  StudyGuide,
  ChatMessage,
  ContentType,
  Recommendations,
} from "./types";
import { analyzeContent, analyzeUpload, sendChatMessage } from "./api";

const TABS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  {
    id: "guide",
    label: "Study Guide",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    id: "quiz",
    label: "Quiz",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    id: "chat",
    label: "AI Tutor",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
];

export default function App() {
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendations>({});
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("guide");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceContentType, setSourceContentType] =
    useState<ContentType>("PDF Document");

  const handleProcess = useCallback(
    async (source: string | File, contentType: ContentType) => {
      setIsProcessing(true);
      setError(null);
      try {
        let studyGuideResult: StudyGuide;
        let recommendationsResult: Recommendations;
        // For uploads there's no real URL, so the backend hands back a
        // synthetic source_id used purely as a chat cache key.
        let resolvedSourceId: string;

        if (source instanceof File) {
          const result = await analyzeUpload(source, contentType);
          studyGuideResult = result.study_guide;
          recommendationsResult = result.recommendations;
          resolvedSourceId = result.source_id;
        } else {
          const result = await analyzeContent(source, contentType);
          studyGuideResult = result.study_guide;
          recommendationsResult = result.recommendations;
          resolvedSourceId = source;
        }

        setStudyGuide(studyGuideResult);
        setRecommendations(recommendationsResult ?? {});
        setChatHistory([]);
        setSourceUrl(resolvedSourceId);
        setSourceContentType(contentType);
        setActiveTab("guide");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  const handleChat = useCallback(
    async (message: string) => {
      const userMsg: ChatMessage = { role: "user", content: message };
      setChatHistory((prev) => [...prev, userMsg]);
      setIsChatLoading(true);
      try {
        const updatedHistory = [...chatHistory, userMsg];
        const result = await sendChatMessage(
          message,
          updatedHistory,
          sourceUrl,
          sourceContentType,
        );
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: result.response },
        ]);
      } catch (err) {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Sorry, an error occurred: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
        ]);
      } finally {
        setIsChatLoading(false);
      }
    },
    [chatHistory, sourceUrl, sourceContentType],
  );

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar
        onProcess={handleProcess}
        isProcessing={isProcessing}
        error={error}
        hasContent={!!studyGuide}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {studyGuide ? (
          <>
            {/* Tab navigation */}
            <div className="flex-shrink-0 border-b border-slate-200 bg-white px-6 shadow-sm">
              <div className="flex gap-0.5">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer ${
                      activeTab === tab.id
                        ? "border-violet-600 text-violet-700"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div
              className={`flex-1 overflow-y-auto p-6 ${
                activeTab === "chat" ? "flex flex-col" : ""
              }`}
            >
              {activeTab === "guide" && (
                <StudyGuideTab
                  studyGuide={studyGuide}
                  recommendations={recommendations}
                />
              )}
              {activeTab === "quiz" && <QuizTab quiz={studyGuide.quiz} />}
              {activeTab === "chat" && (
                <ChatTab
                  chatHistory={chatHistory}
                  onSend={handleChat}
                  isLoading={isChatLoading}
                />
              )}
            </div>
          </>
        ) : (
          <WelcomeScreen />
        )}
      </main>
    </div>
  );
}
