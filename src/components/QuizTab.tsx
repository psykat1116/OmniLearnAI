import { useState } from 'react';
import type { QuizQuestion } from '../types';

interface QuizTabProps {
  quiz: QuizQuestion[];
}

type AnswerMap = Record<number, string>;

export function QuizTab({ quiz }: QuizTabProps) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [expandedReview, setExpandedReview] = useState<Record<number, boolean>>({});

  const answeredCount = Object.keys(answers).length;
  const score = submitted
    ? quiz.filter((q, i) => answers[i] === q.answer).length
    : 0;
  const scorePct = submitted ? Math.round((score / quiz.length) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const wrongIdx: Record<number, boolean> = {};
    quiz.forEach((q, i) => {
      if (answers[i] !== q.answer) wrongIdx[i] = true;
    });
    setExpandedReview(wrongIdx);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setExpandedReview({});
  };

  const toggleReview = (i: number) => {
    setExpandedReview((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const scoreColor =
    scorePct === 100
      ? { banner: 'bg-green-50 border-green-200', circle: 'bg-green-100 text-green-700', text: 'text-green-700' }
      : scorePct >= 50
      ? { banner: 'bg-amber-50 border-amber-200', circle: 'bg-amber-100 text-amber-700', text: 'text-amber-700' }
      : { banner: 'bg-red-50 border-red-200', circle: 'bg-red-100 text-red-700', text: 'text-red-700' };

  const scoreLabel =
    scorePct === 100 ? 'Perfect Score!' : scorePct >= 50 ? 'Good Job!' : 'Keep Practicing!';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-slate-900 font-semibold text-base flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Test Your Comprehension
          <span className="text-slate-400 font-normal">({quiz.length} Questions)</span>
        </h2>
        {submitted && (
          <button
            onClick={handleReset}
            className="text-slate-500 hover:text-slate-800 text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retake Quiz
          </button>
        )}
      </div>

      {/* Score banner */}
      {submitted && (
        <div className={`rounded-xl p-5 border flex items-center gap-4 ${scoreColor.banner}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 ${scoreColor.circle}`}>
            {scorePct}%
          </div>
          <div>
            <p className={`font-semibold text-lg ${scoreColor.text}`}>{scoreLabel}</p>
            <p className="text-slate-500 text-sm">
              You got {score} out of {quiz.length} questions correct.
            </p>
          </div>
        </div>
      )}

      {/* Questions */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {quiz.map((q, i) => {
          const userAnswer = answers[i];
          const isCorrect = userAnswer === q.answer;
          const isExpanded = expandedReview[i];

          const cardBorder = submitted
            ? isCorrect
              ? 'border-green-300'
              : 'border-red-300'
            : 'border-slate-200';

          const badgeBg = submitted
            ? isCorrect
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            : 'bg-violet-100 text-violet-700';

          return (
            <div
              key={i}
              className={`bg-white border rounded-xl overflow-hidden transition-colors shadow-sm ${cardBorder}`}
            >
              <div className="px-5 py-4">
                <div className="flex items-start gap-3 mb-4">
                  <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${badgeBg}`}>
                    {i + 1}
                  </span>
                  <p className="text-slate-800 text-sm font-medium leading-relaxed pt-0.5">
                    {q.question}
                  </p>
                </div>

                <div className="flex flex-col gap-2 ml-10">
                  {q.options.map((option) => {
                    const isSelected = userAnswer === option;
                    const isCorrectOption = option === q.answer;

                    let style =
                      'border-slate-200 bg-white text-slate-700 hover:border-violet-400 hover:bg-violet-50 cursor-pointer';
                    if (submitted) {
                      if (isCorrectOption) {
                        style = 'border-green-400 bg-green-50 text-green-800 cursor-default';
                      } else if (isSelected) {
                        style = 'border-red-400 bg-red-50 text-red-700 cursor-default';
                      } else {
                        style = 'border-slate-200 bg-slate-50 text-slate-400 cursor-default';
                      }
                    } else if (isSelected) {
                      style = 'border-violet-500 bg-violet-50 text-violet-800 cursor-pointer';
                    }

                    const dotColor = submitted
                      ? isCorrectOption
                        ? 'bg-green-500'
                        : isSelected
                        ? 'bg-red-500'
                        : ''
                      : isSelected
                      ? 'bg-violet-500'
                      : '';

                    const ringColor = submitted
                      ? isCorrectOption
                        ? 'border-green-500'
                        : isSelected
                        ? 'border-red-500'
                        : 'border-slate-300'
                      : isSelected
                      ? 'border-violet-500'
                      : 'border-slate-400';

                    const showDot = isSelected || (submitted && isCorrectOption);

                    return (
                      <label key={option} className={`flex items-center gap-3 border rounded-lg px-4 py-2.5 transition-all ${style}`}>
                        <input
                          type="radio"
                          name={`q_${i}`}
                          value={option}
                          checked={isSelected}
                          onChange={() => !submitted && setAnswers((prev) => ({ ...prev, [i]: option }))}
                          disabled={submitted}
                          className="sr-only"
                        />
                        <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${ringColor}`}>
                          {showDot && dotColor && (
                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                          )}
                        </span>
                        <span className="text-sm">{option}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {submitted && (
                <div className="border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => toggleReview(i)}
                    className="w-full flex items-center justify-between px-5 py-3 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {isCorrect
                        ? 'Correct! Click to see explanation'
                        : `Incorrect or Correct answer: "${q.answer}"`}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                        <p className="text-slate-700 text-sm leading-relaxed">
                          <span className="text-violet-600 font-medium">Explanation: </span>
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!submitted && (
          <button
            type="submit"
            disabled={answeredCount < quiz.length}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-medium rounded-xl py-3 px-4 text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed mt-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Submit Quiz
            {answeredCount < quiz.length && (
              <span className="text-violet-200 font-normal ml-1">
                ({answeredCount}/{quiz.length} answered)
              </span>
            )}
          </button>
        )}
      </form>
    </div>
  );
}
