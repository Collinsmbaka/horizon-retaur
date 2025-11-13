/**
 * Quiz Result Form - Form Submission Logic
 * Handles lead capture and webhook integration
 */

(function() {
  'use strict';

  // Constants
  const STORAGE_KEYS = {
    ANSWERS: 'quizAnswers',
    RESULT: 'quizResult',
    TIMESTAMP: 'quizTimestamp'
  };

  // State
  let quizData = {
    bodyType: null,
    answers: null,
    timestamp: null
  };

  let resultForm = null;
  let submitButton = null;
  let loadingElement = null;
  let errorElement = null;

  /**
   * Initialize result page
   */
  function initResultPage() {
    // Get DOM elements
    resultForm = document.getElementById('resultForm');
    submitButton = document.getElementById('submitBtn');
    loadingElement = document.getElementById('formLoading');
    errorElement = document.getElementById('formError');

    if (!resultForm) {
      console.error('Result form not found');
      return;
    }

    // Load quiz data from localStorage
    if (!loadQuizData()) {
      // No quiz data found, redirect back to quiz
      redirectToQuiz();
      return;
    }

    // Setup form submission
    resultForm.addEventListener('submit', handleFormSubmit);
  }

  /**
   * Load quiz data from localStorage
   * Returns false if data is missing or invalid
   */
  function loadQuizData() {
    try {
      const bodyType = localStorage.getItem(STORAGE_KEYS.RESULT);
      const answersJson = localStorage.getItem(STORAGE_KEYS.ANSWERS);
      const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);

      // Validate data exists
      if (!bodyType || !answersJson || !timestamp) {
        return false;
      }

      // Parse answers
      const answers = JSON.parse(answersJson);

      // Validate answers object
      if (!answers || typeof answers !== 'object') {
        return false;
      }

      // Store data
      quizData = {
        bodyType: bodyType,
        answers: answers,
        timestamp: timestamp
      };

      return true;

    } catch (error) {
      console.error('Error loading quiz data:', error);
      return false;
    }
  }

  /**
   * Redirect to quiz page (if no quiz data)
   */
  function redirectToQuiz() {
    const quizPageUrl = window.resultFormSettings?.quizPageUrl || '/pages/body-type-quiz';
    window.location.href = quizPageUrl;
  }

  /**
   * Handle form submission
   */
  async function handleFormSubmit(event) {
    event.preventDefault();

    // Prevent multiple submissions
    if (submitButton.disabled) {
      return;
    }

    // Get form data
    const name = document.getElementById('fullName').value.trim();
    const whatsapp = document.getElementById('whatsappNumber').value.trim();

    // Basic validation
    if (!name || !whatsapp) {
      showError('Please fill in all fields.');
      return;
    }

    // Show loading state
    showLoading();

    // Format phone number
    const formattedWhatsapp = formatPhoneNumber(whatsapp);

    // Prepare payload for Make.com
    const payload = {
      timestamp: quizData.timestamp,
      name: name,
      whatsapp: formattedWhatsapp,
      body_type: quizData.bodyType,
      q1: quizData.answers.q1 || null,
      q2: quizData.answers.q2 || null,
      q3: quizData.answers.q3 || null,
      q4: quizData.answers.q4 || null,
      q5: quizData.answers.q5 || null
    };

    // Submit to webhook
    try {
      await submitToWebhook(payload);

      // Success: Clear localStorage
      clearQuizData();

      // Redirect to WhatsApp
      redirectToWhatsApp();

    } catch (error) {
      console.error('Submission error:', error);
      showError();
      hideLoading();
    }
  }

  /**
   * Submit data to Make.com webhook
   */
  async function submitToWebhook(payload) {
    const webhookUrl = window.resultFormSettings?.webhookUrl;

    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status}`);
    }

    return response;
  }

  /**
   * Format phone number (add + prefix if missing)
   */
  function formatPhoneNumber(phone) {
    // Remove all spaces
    phone = phone.replace(/\s/g, '');

    // Add + prefix if missing
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }

    return phone;
  }

  /**
   * Show loading state
   */
  function showLoading() {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.style.display = 'none';
    }

    if (loadingElement) {
      loadingElement.style.display = 'block';
    }

    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  /**
   * Hide loading state
   */
  function hideLoading() {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.style.display = 'block';
    }

    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
  }

  /**
   * Show error message
   */
  function showError(customMessage) {
    if (errorElement) {
      if (customMessage) {
        errorElement.textContent = customMessage;
      }
      errorElement.style.display = 'block';
    }
  }

  /**
   * Clear quiz data from localStorage
   */
  function clearQuizData() {
    localStorage.removeItem(STORAGE_KEYS.ANSWERS);
    localStorage.removeItem(STORAGE_KEYS.RESULT);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
  }

  /**
   * Redirect to WhatsApp group
   */
  function redirectToWhatsApp() {
    const whatsappUrl = window.resultFormSettings?.whatsappGroupUrl;

    if (whatsappUrl) {
      window.location.href = whatsappUrl;
    } else {
      console.error('WhatsApp group URL not configured');
      showError('Configuration error. Please contact support.');
      hideLoading();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResultPage);
  } else {
    initResultPage();
  }

})();
