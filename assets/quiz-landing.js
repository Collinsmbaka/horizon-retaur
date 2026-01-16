/**
 * Body Type Quiz - Main Logic
 * Handles quiz interaction, scoring, and result calculation
 */

(function() {
  'use strict';

  // Constants
  const STORAGE_KEYS = {
    ANSWERS: 'quizAnswers',
    RESULT: 'quizResult',
    TIMESTAMP: 'quizTimestamp',
    GENDER: 'quizGender'
  };

  const EXPIRY_HOURS = 48;
  const BODY_TYPES = {
    A: 'ECTOMORPH',
    B: 'MESOMORPH',
    C: 'ENDOMORPH'
  };

  // State
  let quizAnswers = {};
  let totalQuestions = 0;
  let quizForm = null;
  let submitButton = null;
  let progressCount = null;
  let progressFill = null;
  let genderSelect = null;
  let currentGender = 'female'; // Default to female

  /**
   * Initialize quiz on page load
   */
  function initQuiz() {
    // Get DOM elements
    quizForm = document.getElementById('bodyTypeQuiz');
    submitButton = document.querySelector('.quiz-submit-btn');
    progressCount = document.querySelector('.progress-count');
    progressFill = document.querySelector('.progress-fill');
    genderSelect = document.getElementById('genderSelect');

    if (!quizForm) {
      console.error('Quiz form not found');
      return;
    }

    // Get total questions
    const questionElements = document.querySelectorAll('.quiz-question');
    totalQuestions = questionElements.length;

    // Clear expired data
    clearExpiredData();

    // Load saved gender from localStorage
    loadSavedGender();

    // Load saved answers from localStorage
    loadSavedAnswers();

    // Add event listener for gender selection
    if (genderSelect) {
      genderSelect.addEventListener('change', handleGenderChange);
    }

    // Add event listeners to all radio buttons
    const radioButtons = quizForm.querySelectorAll('.answer-radio');
    radioButtons.forEach(radio => {
      radio.addEventListener('change', handleAnswerSelect);
    });

    // Add submit handler
    quizForm.addEventListener('submit', handleSubmit);

    // Initial state check
    updateQuizState();
  }

  /**
   * Clear quiz data if expired (>48 hours)
   */
  function clearExpiredData() {
    const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);

    if (timestamp) {
      const savedTime = new Date(timestamp);
      const currentTime = new Date();
      const hoursDiff = (currentTime - savedTime) / (1000 * 60 * 60);

      if (hoursDiff > EXPIRY_HOURS) {
        // Data expired, clear everything
        clearQuizData();
      }
    }
  }

  /**
   * Load saved gender from localStorage
   */
  function loadSavedGender() {
    const savedGender = localStorage.getItem(STORAGE_KEYS.GENDER);

    if (savedGender && (savedGender === 'male' || savedGender === 'female')) {
      currentGender = savedGender;
    } else {
      // Default to female
      currentGender = 'female';
      localStorage.setItem(STORAGE_KEYS.GENDER, currentGender);
    }

    // Update dropdown to match saved gender
    if (genderSelect) {
      genderSelect.value = currentGender;
    }

    // Update image visibility
    updateGenderImages();
  }

  /**
   * Handle gender dropdown change
   */
  function handleGenderChange(event) {
    const newGender = event.target.value;

    // Get current answer for Q1 before switching
    const currentQ1Answer = quizAnswers['q1'];

    // Update current gender
    currentGender = newGender;

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.GENDER, currentGender);
    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, new Date().toISOString());

    // Update image visibility
    updateGenderImages();

    // If Q1 was answered, re-select the same answer in the new gender's radio buttons
    if (currentQ1Answer) {
      const newRadio = document.querySelector(
        `.question-answers--images[data-gender="${currentGender}"] input[value="${currentQ1Answer}"]`
      );
      if (newRadio) {
        newRadio.checked = true;
      }
    }
  }

  /**
   * Update visibility of gender-specific images
   */
  function updateGenderImages() {
    const maleImages = document.querySelector('.question-answers--images[data-gender="male"]');
    const femaleImages = document.querySelector('.question-answers--images[data-gender="female"]');

    if (maleImages && femaleImages) {
      if (currentGender === 'male') {
        maleImages.style.display = '';
        femaleImages.style.display = 'none';
      } else {
        maleImages.style.display = 'none';
        femaleImages.style.display = '';
      }
    }
  }

  /**
   * Load saved answers from localStorage
   */
  function loadSavedAnswers() {
    try {
      const savedAnswers = localStorage.getItem(STORAGE_KEYS.ANSWERS);

      if (savedAnswers) {
        quizAnswers = JSON.parse(savedAnswers);

        // Pre-select radio buttons based on saved answers
        Object.keys(quizAnswers).forEach(questionId => {
          const answer = quizAnswers[questionId];
          const radio = document.querySelector(`input[name="${questionId}"][value="${answer}"]`);

          if (radio) {
            radio.checked = true;
          }
        });
      }
    } catch (error) {
      console.error('Error loading saved answers:', error);
      clearQuizData();
    }
  }

  /**
   * Handle answer selection
   */
  function handleAnswerSelect(event) {
    const radio = event.target;
    const questionName = radio.name; // e.g., "q1", "q2"
    const answerValue = radio.value; // "A", "B", or "C"

    // Update answers object
    quizAnswers[questionName] = answerValue;

    // Save to localStorage
    saveAnswersToStorage();

    // Update quiz state (progress, submit button)
    updateQuizState();
  }

  /**
   * Save answers to localStorage
   */
  function saveAnswersToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(quizAnswers));
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, new Date().toISOString());
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Update quiz state (progress indicator and submit button)
   */
  function updateQuizState() {
    const answeredCount = Object.keys(quizAnswers).length;
    const allAnswered = answeredCount === totalQuestions;

    // Update progress text
    if (progressCount) {
      progressCount.textContent = answeredCount;
    }

    // Update progress bar
    if (progressFill) {
      const percentage = (answeredCount / totalQuestions) * 100;
      progressFill.style.width = `${percentage}%`;
    }

    // Enable/disable submit button
    if (submitButton) {
      submitButton.disabled = !allAnswered;
    }
  }

  /**
   * Calculate body type based on answers
   * CRITICAL: Only Q1-Q4 count for scoring, Q5 is ignored
   */
  function calculateBodyType() {
    const scores = { A: 0, B: 0, C: 0 };

    // Get all scored questions (check data-scored attribute)
    const scoredQuestions = document.querySelectorAll('.quiz-question[data-scored="true"]');

    scoredQuestions.forEach(questionEl => {
      const questionId = questionEl.getAttribute('data-question-id');
      const answer = quizAnswers[questionId];

      if (answer && scores.hasOwnProperty(answer)) {
        scores[answer]++;
      }
    });

    // Determine winner with tie-breaker (A > B > C)
    let bodyType;

    if (scores.A >= scores.B && scores.A >= scores.C) {
      bodyType = BODY_TYPES.A; // ECTOMORPH
    } else if (scores.B >= scores.C) {
      bodyType = BODY_TYPES.B; // MESOMORPH
    } else {
      bodyType = BODY_TYPES.C; // ENDOMORPH
    }

    return bodyType;
  }

  /**
   * Get result page URL based on body type
   */
  function getResultPageUrl(bodyType) {
    if (!window.quizSettings) {
      console.error('Quiz settings not found');
      return '/';
    }

    switch (bodyType) {
      case BODY_TYPES.A:
        return window.quizSettings.ectomorphUrl || '/pages/quiz-result-ectomorph';
      case BODY_TYPES.B:
        return window.quizSettings.mesomorphUrl || '/pages/quiz-result-mesomorph';
      case BODY_TYPES.C:
        return window.quizSettings.endomorphUrl || '/pages/quiz-result-endomorph';
      default:
        return '/';
    }
  }

  /**
   * Handle quiz submission
   */
  function handleSubmit(event) {
    event.preventDefault();

    // Verify all questions are answered
    if (Object.keys(quizAnswers).length !== totalQuestions) {
      alert('Please answer all questions before submitting.');
      return;
    }

    // Calculate body type
    const bodyType = calculateBodyType();

    // Save result to localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.RESULT, bodyType);
      localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(quizAnswers));
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, new Date().toISOString());
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }

    // Get redirect URL
    const redirectUrl = getResultPageUrl(bodyType);

    // Redirect to result page
    window.location.href = redirectUrl;
  }

  /**
   * Clear all quiz data from localStorage
   */
  function clearQuizData() {
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
    localStorage.removeItem(STORAGE_KEYS.RESULT);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.GENDER);
    quizAnswers = {};
    currentGender = 'female';
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuiz);
  } else {
    initQuiz();
  }

})();
