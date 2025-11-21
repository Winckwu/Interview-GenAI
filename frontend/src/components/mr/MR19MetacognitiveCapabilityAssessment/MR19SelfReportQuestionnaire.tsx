/**
 * MR19: Self-Report Questionnaire Component
 * 36-item metacognitive behavior frequency assessment
 * Based on Schraw & Dennison (1994) MAI and 12-subprocess framework
 */

import React, { useState } from 'react';
import {
  QUESTIONNAIRE_ITEMS,
  RATING_LABELS,
  CATEGORY_LABELS,
  SUBDIMENSION_LABELS,
  QuestionID,
  QuestionItem,
} from './questionnaireData';
import './MR19SelfReportQuestionnaire.css';

interface QuestionnaireResponse {
  [questionId: string]: number; // 1-5 rating
}

interface SubdimensionScore {
  dimension: string;
  score: number; // 1-5 raw average
  mappedScore: number; // 0-3 for pattern analysis
}

interface Props {
  onComplete: (scores: SubdimensionScore[]) => void;
  language: 'en' | 'cn';
}

export const MR19SelfReportQuestionnaire: React.FC<Props> = ({
  onComplete,
  language,
}) => {
  const [responses, setResponses] = useState<QuestionnaireResponse>({});
  const [currentCategory, setCurrentCategory] = useState<
    'Planning' | 'Monitoring' | 'Evaluation' | 'Regulation'
  >('Planning');

  // Group questions by category
  const questionsByCategory = {
    Planning: QUESTIONNAIRE_ITEMS.filter((q) => q.category === 'Planning'),
    Monitoring: QUESTIONNAIRE_ITEMS.filter((q) => q.category === 'Monitoring'),
    Evaluation: QUESTIONNAIRE_ITEMS.filter((q) => q.category === 'Evaluation'),
    Regulation: QUESTIONNAIRE_ITEMS.filter((q) => q.category === 'Regulation'),
  };

  const categories: Array<'Planning' | 'Monitoring' | 'Evaluation' | 'Regulation'> = [
    'Planning',
    'Monitoring',
    'Evaluation',
    'Regulation',
  ];

  const currentCategoryIndex = categories.indexOf(currentCategory);
  const currentQuestions = questionsByCategory[currentCategory];

  // Calculate progress
  const totalQuestions = QUESTIONNAIRE_ITEMS.length;
  const answeredQuestions = Object.keys(responses).length;
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;

  // Check if current category is complete
  const isCategoryComplete = currentQuestions.every((q) => responses[q.id] !== undefined);

  // Check if all questions are answered
  const isQuestionnaireComplete = answeredQuestions === totalQuestions;

  const handleRating = (questionId: QuestionID, rating: number) => {
    const updatedResponses = {
      ...responses,
      [questionId]: rating,
    };
    setResponses(updatedResponses);

    // Auto-scroll to next unanswered question after a short delay
    setTimeout(() => {
      const currentQuestionIndex = currentQuestions.findIndex((q) => q.id === questionId);
      const nextUnansweredIndex = currentQuestions.findIndex(
        (q, idx) => idx > currentQuestionIndex && updatedResponses[q.id] === undefined
      );

      if (nextUnansweredIndex !== -1) {
        // Find the next unanswered question card and scroll to it
        const questionCards = document.querySelectorAll('.question-card');
        const nextCard = questionCards[nextUnansweredIndex];
        if (nextCard) {
          nextCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }, 300); // Small delay to ensure DOM update
  };

  const handleNext = () => {
    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategory(categories[currentCategoryIndex + 1]);

      // Scroll to category header after a short delay to ensure DOM update
      setTimeout(() => {
        const categoryHeader = document.querySelector('.category-header');
        if (categoryHeader) {
          categoryHeader.scrollIntoView({
            behavior: 'smooth',
            block: 'start', // Align to top of viewport
          });
        }
      }, 100);
    }
  };

  const handlePrevious = () => {
    if (currentCategoryIndex > 0) {
      setCurrentCategory(categories[currentCategoryIndex - 1]);

      // Scroll to category header after a short delay to ensure DOM update
      setTimeout(() => {
        const categoryHeader = document.querySelector('.category-header');
        if (categoryHeader) {
          categoryHeader.scrollIntoView({
            behavior: 'smooth',
            block: 'start', // Align to top of viewport
          });
        }
      }, 100);
    }
  };

  const calculateScores = (): SubdimensionScore[] => {
    const dimensions = ['P1', 'P2', 'P3', 'P4', 'M1', 'M2', 'M3', 'E1', 'E2', 'E3', 'R1', 'R2'];

    return dimensions.map((dimension) => {
      const dimensionQuestions = QUESTIONNAIRE_ITEMS.filter((q) => q.dimension === dimension);

      // Calculate average score (handling reverse items)
      let sum = 0;
      dimensionQuestions.forEach((q) => {
        const rating = responses[q.id] || 1;
        const score = q.reversed ? 6 - rating : rating; // Reverse scoring: 6 - x
        sum += score;
      });

      const rawScore = sum / dimensionQuestions.length; // 1-5 scale

      // Map to 0-3 scale for pattern analysis
      let mappedScore: number;
      if (rawScore < 1.76) {
        mappedScore = 0;
      } else if (rawScore < 2.76) {
        mappedScore = 1;
      } else if (rawScore < 3.76) {
        mappedScore = 2;
      } else {
        mappedScore = 3;
      }

      return {
        dimension,
        score: parseFloat(rawScore.toFixed(2)),
        mappedScore,
      };
    });
  };

  const handleSubmit = () => {
    if (isQuestionnaireComplete) {
      const scores = calculateScores();
      onComplete(scores);
    }
  };

  return (
    <div className="questionnaire-container">
      {/* Progress Bar */}
      <div className="questionnaire-progress">
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="progress-text">
          {language === 'en'
            ? `Progress: ${answeredQuestions}/${totalQuestions} questions`
            : `进度：${answeredQuestions}/${totalQuestions} 题`}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="category-navigation">
        {categories.map((cat) => {
          const catQuestions = questionsByCategory[cat];
          const catAnswered = catQuestions.filter((q) => responses[q.id] !== undefined).length;
          const catTotal = catQuestions.length;
          const catComplete = catAnswered === catTotal;

          return (
            <button
              key={cat}
              className={`category-nav-button ${currentCategory === cat ? 'active' : ''} ${
                catComplete ? 'complete' : ''
              }`}
              onClick={() => setCurrentCategory(cat)}
            >
              <span className="category-icon">{CATEGORY_LABELS[cat].icon}</span>
              <span className="category-name">
                {language === 'en' ? CATEGORY_LABELS[cat].en : CATEGORY_LABELS[cat].cn}
              </span>
              <span className="category-progress">
                {catAnswered}/{catTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Category Header */}
      <div className="category-header">
        <div className="category-icon-large">{CATEGORY_LABELS[currentCategory].icon}</div>
        <div>
          <h2 className="category-title">
            {language === 'en'
              ? CATEGORY_LABELS[currentCategory].en
              : CATEGORY_LABELS[currentCategory].cn}
          </h2>
          <p className="category-description">
            {language === 'en'
              ? `${currentQuestions.length} questions about your ${currentCategory.toLowerCase()} behaviors`
              : `${currentQuestions.length} 道关于${CATEGORY_LABELS[currentCategory].cn}行为的问题`}
          </p>
        </div>
      </div>

      {/* Questions List */}
      <div className="questions-list">
        {currentQuestions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index + 1}
            response={responses[question.id]}
            onRate={handleRating}
            language={language}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="questionnaire-navigation">
        <button
          className="nav-button prev-button"
          onClick={handlePrevious}
          disabled={currentCategoryIndex === 0}
        >
          {language === 'en' ? '← Previous' : '← 上一页'}
        </button>

        <div className="nav-info">
          {language === 'en'
            ? `Section ${currentCategoryIndex + 1} of ${categories.length}`
            : `第 ${currentCategoryIndex + 1}/${categories.length} 部分`}
        </div>

        {currentCategoryIndex < categories.length - 1 ? (
          <button
            className="nav-button next-button"
            onClick={handleNext}
            disabled={!isCategoryComplete}
          >
            {language === 'en' ? 'Next →' : '下一页 →'}
          </button>
        ) : (
          <button
            className="nav-button submit-button"
            onClick={handleSubmit}
            disabled={!isQuestionnaireComplete}
          >
            {language === 'en' ? 'Submit ✓' : '提交 ✓'}
          </button>
        )}
      </div>

      {/* Hint for incomplete category */}
      {!isCategoryComplete && (
        <div className="hint-message">
          {language === 'en'
            ? 'Please answer all questions in this section to continue'
            : '请回答本部分的所有问题以继续'}
        </div>
      )}
    </div>
  );
};

/**
 * Individual Question Card Component
 */
interface QuestionCardProps {
  question: QuestionItem;
  index: number;
  response: number | undefined;
  onRate: (questionId: QuestionID, rating: number) => void;
  language: 'en' | 'cn';
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  response,
  onRate,
  language,
}) => {
  const subdimensionLabel =
    SUBDIMENSION_LABELS[question.dimension][language === 'en' ? 'en' : 'cn'];

  return (
    <div className={`question-card ${response !== undefined ? 'answered' : ''}`}>
      {/* Question Header */}
      <div className="question-header">
        <span className="question-number">Q{index}</span>
        <span className="question-dimension">{subdimensionLabel}</span>
        {question.reversed && (
          <span className="reverse-indicator" title={language === 'en' ? 'Reverse item' : '反向题'}>
            🔄
          </span>
        )}
      </div>

      {/* Question Text */}
      <div className="question-text">
        {language === 'en' ? question.text : question.textCN}
      </div>

      {/* Rating Scale */}
      <div className="rating-scale">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            className={`rating-button ${response === rating ? 'selected' : ''}`}
            onClick={() => onRate(question.id, rating)}
            aria-label={`Rate ${rating}`}
          >
            <span className="rating-value">{rating}</span>
            <span className="rating-label">
              {RATING_LABELS[rating as keyof typeof RATING_LABELS][language]}
            </span>
          </button>
        ))}
      </div>

      {/* Scale Endpoints */}
      <div className="scale-endpoints">
        <span className="scale-left">
          {language === 'en' ? RATING_LABELS[1].en : RATING_LABELS[1].cn}
        </span>
        <span className="scale-right">
          {language === 'en' ? RATING_LABELS[5].en : RATING_LABELS[5].cn}
        </span>
      </div>
    </div>
  );
};

export default MR19SelfReportQuestionnaire;
