import { Component } from '@theme/component';

/**
 * Protein Calculator Component
 * Calculates daily protein needs and recommends Retaur products
 *
 * @typedef {Object} ProteinCalculatorRefs
 * @property {HTMLFormElement} form - Calculator form
 * @property {HTMLElement} results - Results section
 * @property {HTMLSelectElement} sexInput - Sex selection dropdown
 * @property {HTMLInputElement} ageInput - Age input
 * @property {HTMLInputElement} heightInput - Height input
 * @property {HTMLInputElement} weightInput - Weight input
 * @property {HTMLSelectElement} activityInput - Activity level dropdown
 * @property {HTMLSelectElement} goalInput - Goal selection dropdown
 * @property {HTMLButtonElement} submitButton - Calculate button
 * @property {HTMLElement} proteinTarget - Protein target display
 * @property {HTMLElement} resultSubtext - Result subtext
 * @property {HTMLElement} perMeal2 - Protein per meal (2 meals)
 * @property {HTMLElement} perMeal3 - Protein per meal (3 meals)
 * @property {HTMLElement} yogurtRecommendation - Yogurt recommendation details
 * @property {HTMLElement} wheyRecommendation - Whey recommendation details
 * @property {HTMLElement} programCard - Muscle guarantee program card
 * @property {HTMLElement} programProtein - Protein amount in program card
 * @property {HTMLElement} comboCard - Combo suggestion card
 * @property {HTMLElement} comboRecommendation - Combo recommendation details
 * @property {HTMLButtonElement} recalculateButton - Recalculate button
 * @property {HTMLElement} srAnnouncement - Screen reader announcement
 * @property {HTMLElement} sexError - Sex error message
 * @property {HTMLElement} ageError - Age error message
 * @property {HTMLElement} heightError - Height error message
 * @property {HTMLElement} weightError - Weight error message
 * @property {HTMLElement} activityError - Activity error message
 * @property {HTMLElement} goalError - Goal error message
 */

/**
 * @extends {Component<ProteinCalculatorRefs>}
 */
class ProteinCalculator extends Component {
  /** @type {string} */
  static STORAGE_KEY = 'retaur_protein_calculator_data';

  /** @type {Object} */
  static PROTEIN_MULTIPLIERS = {
    lose_weight: 1.8,
    build_muscle: 2.0,
    maintain: 1.6,
    athletic: 1.8,
  };

  /** @type {Object} */
  static VALIDATION_RULES = {
    age: { min: 18, max: 80, message: 'Please enter your age (must be 18 or older)' },
    height: { min: 120, max: 250, message: 'Please enter a valid height (120-250 cm)' },
    weight: { min: 40, max: 200, message: 'Please enter a valid weight (40-200 kg)' },
  };

  /** @type {Object} */
  static ACTIVITY_LABELS = {
    sedentary: 'sedentary',
    lightly_active: 'lightly active',
    moderately_active: 'moderately active',
    very_active: 'very active',
    extremely_active: 'extremely active',
  };

  /** @type {Object} */
  static GOAL_LABELS = {
    lose_weight: 'weight loss',
    build_muscle: 'muscle building',
    maintain: 'weight maintenance',
    athletic: 'athletic performance',
  };

  /**
   * Called when component is connected to DOM
   */
  connectedCallback() {
    super.connectedCallback();

    // Load saved inputs from localStorage
    this.loadSavedInputs();

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Handle events
   * @param {Event} event
   */
  handleEvent(event) {
    if (event.type === 'submit') {
      event.preventDefault();
      this.handleSubmit();
    } else if (event.type === 'blur') {
      this.validateField(/** @type {HTMLInputElement} */ (event.target));
    } else if (event.type === 'input') {
      this.saveInputs();
      // Clear error on input
      const input = /** @type {HTMLInputElement} */ (event.target);
      if (input.classList.contains('error')) {
        this.clearFieldError(input);
      }
    } else if (event.type === 'change') {
      this.saveInputs();
      // Validate on change for select dropdowns
      const input = /** @type {HTMLSelectElement} */ (event.target);
      if (input.tagName === 'SELECT') {
        this.validateField(input);
      }
    } else if (event.type === 'click') {
      const target = /** @type {HTMLElement} */ (event.target);
      if (target.matches('[data-cta-product]')) {
        this.trackCTAClick(target);
      }
    }
  }

  /**
   * Attach all event listeners
   */
  attachEventListeners() {
    // Form submit
    this.refs.form.addEventListener('submit', this);

    // Input validation
    this.refs.ageInput.addEventListener('blur', this);
    this.refs.heightInput.addEventListener('blur', this);
    this.refs.weightInput.addEventListener('blur', this);

    // Input changes for localStorage
    this.refs.ageInput.addEventListener('input', this);
    this.refs.heightInput.addEventListener('input', this);
    this.refs.weightInput.addEventListener('input', this);

    // Select dropdowns for validation and localStorage
    this.refs.sexInput.addEventListener('change', this);
    this.refs.activityInput.addEventListener('change', this);
    this.refs.goalInput.addEventListener('change', this);

    // Recalculate button
    this.refs.recalculateButton.addEventListener('click', () => {
      this.scrollToTop();
    });

    // Track CTA clicks
    const ctaButtons = this.querySelectorAll('[data-cta-product]');
    ctaButtons.forEach((button) => {
      button.addEventListener('click', this);
    });
  }

  /**
   * Load saved inputs from localStorage
   */
  loadSavedInputs() {
    try {
      const saved = localStorage.getItem(ProteinCalculator.STORAGE_KEY);
      if (!saved) return;

      const data = JSON.parse(saved);

      // Restore values for select dropdowns and inputs
      if (data.sex) this.refs.sexInput.value = data.sex;
      if (data.age) this.refs.ageInput.value = data.age;
      if (data.height) this.refs.heightInput.value = data.height;
      if (data.weight) this.refs.weightInput.value = data.weight;
      if (data.activity) this.refs.activityInput.value = data.activity;
      if (data.goal) this.refs.goalInput.value = data.goal;
    } catch (error) {
      console.error('Error loading saved inputs:', error);
    }
  }

  /**
   * Save current inputs to localStorage
   */
  saveInputs() {
    try {
      const data = {
        sex: this.refs.sexInput.value,
        age: this.refs.ageInput.value,
        height: this.refs.heightInput.value,
        weight: this.refs.weightInput.value,
        activity: this.refs.activityInput.value,
        goal: this.refs.goalInput.value,
      };

      localStorage.setItem(ProteinCalculator.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving inputs:', error);
    }
  }

  /**
   * Validate a single field
   * @param {HTMLInputElement | HTMLSelectElement} field
   * @returns {boolean}
   */
  validateField(field) {
    const name = field.name || field.id.replace('-input', '').replace('-select', '');
    let isValid = true;
    let errorMessage = '';

    if (field.tagName === 'SELECT') {
      if (!field.value) {
        isValid = false;
        // Customize error message based on field
        if (name === 'sex') {
          errorMessage = 'Please select your biological sex';
        } else if (name === 'goal') {
          errorMessage = 'Please select your primary goal';
        } else {
          errorMessage = 'Please select your activity level';
        }
      }
    } else if (field.type === 'number') {
      const value = parseFloat(field.value);
      const rules = ProteinCalculator.VALIDATION_RULES[name];

      if (!field.value || isNaN(value)) {
        isValid = false;
        errorMessage = rules.message;
      } else if (value < rules.min || value > rules.max) {
        isValid = false;
        errorMessage = rules.message;
      }
    }

    if (!isValid) {
      this.showFieldError(field, errorMessage);
    } else {
      this.clearFieldError(field);
    }

    return isValid;
  }

  /**
   * Show error for a field
   * @param {HTMLInputElement | HTMLSelectElement} field
   * @param {string} message
   */
  showFieldError(field, message) {
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');

    const name = field.name || field.id.replace('-input', '').replace('-select', '');
    const errorElement = this.refs[`${name}Error`];

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('visible');
    }

    // Track validation error
    this.trackValidationError(name, message);
  }

  /**
   * Clear error for a field
   * @param {HTMLInputElement | HTMLSelectElement} field
   */
  clearFieldError(field) {
    field.classList.remove('error');
    field.setAttribute('aria-invalid', 'false');

    const name = field.name || field.id.replace('-input', '').replace('-select', '');
    const errorElement = this.refs[`${name}Error`];

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('visible');
    }
  }

  /**
   * Validate entire form
   * @returns {boolean}
   */
  validateForm() {
    const fields = [
      this.refs.sexInput,
      this.refs.ageInput,
      this.refs.heightInput,
      this.refs.weightInput,
      this.refs.activityInput,
      this.refs.goalInput,
    ];

    let isValid = true;

    for (const field of fields) {
      if (!this.validateField(field)) {
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Handle form submission
   */
  handleSubmit() {
    // Validate form
    if (!this.validateForm()) {
      // Focus first error field
      const firstError = this.refs.form.querySelector('.error');
      if (firstError) {
        firstError.focus();
      }
      return;
    }

    // Get form values
    const formData = this.getFormData();

    // Calculate protein
    const proteinTarget = this.calculateProtein(formData);

    // Display results
    this.displayResults(proteinTarget, formData);

    // Track completion
    this.trackCalculatorCompletion(proteinTarget, formData);

    // Smooth scroll to results
    this.scrollToResults();
  }

  /**
   * Get form data
   * @returns {Object}
   */
  getFormData() {
    return {
      sex: this.refs.sexInput.value,
      age: parseInt(this.refs.ageInput.value, 10),
      height: parseInt(this.refs.heightInput.value, 10),
      weight: parseInt(this.refs.weightInput.value, 10),
      activity: this.refs.activityInput.value,
      goal: this.refs.goalInput.value,
    };
  }

  /**
   * Calculate protein needs
   * @param {Object} formData
   * @returns {number}
   */
  calculateProtein(formData) {
    const multiplier = ProteinCalculator.PROTEIN_MULTIPLIERS[formData.goal];
    const proteinGrams = formData.weight * multiplier;

    // Round to nearest 5 grams
    return Math.round(proteinGrams / 5) * 5;
  }

  /**
   * Display calculation results
   * @param {number} proteinTarget
   * @param {Object} formData
   */
  displayResults(proteinTarget, formData) {
    // Show results section
    this.refs.results.classList.add('visible');

    // Display protein target
    this.refs.proteinTarget.textContent = `${proteinTarget}g`;

    // Display subtext
    const goalLabel = ProteinCalculator.GOAL_LABELS[formData.goal];
    const activityLabel = ProteinCalculator.ACTIVITY_LABELS[formData.activity];
    this.refs.resultSubtext.textContent = `Based on your ${goalLabel} goal and ${activityLabel} lifestyle`;

    // Display per-meal breakdown
    const perMeal2 = Math.round(proteinTarget / 2);
    const perMeal3 = Math.round(proteinTarget / 3);
    this.refs.perMeal2.textContent = `${perMeal2}g`;
    this.refs.perMeal3.textContent = `${perMeal3}g`;

    // Display product recommendations
    this.displayYogurtRecommendation(proteinTarget);
    this.displayWheyRecommendation(proteinTarget);

    // Conditional recommendations
    if (formData.goal === 'build_muscle') {
      this.displayProgramRecommendation(proteinTarget);
      this.refs.comboCard.style.display = 'none';
    } else if (proteinTarget > 100) {
      this.refs.programCard.style.display = 'none';
      this.displayComboRecommendation(proteinTarget);
    } else {
      this.refs.programCard.style.display = 'none';
      this.refs.comboCard.style.display = 'none';
    }

    // Announce to screen readers
    this.announceResults(proteinTarget);
  }

  /**
   * Display yogurt recommendation
   * @param {number} proteinTarget
   */
  displayYogurtRecommendation(proteinTarget) {
    const isHighProtein = proteinTarget >= 140;
    const servingSize = isHighProtein ? '1 cup' : '1/2 cup';
    const proteinFromYogurt = isHighProtein ? 50 : 25;
    const cupsPerWeek = isHighProtein ? 7 : 3.5;
    const cupsPerMonth = isHighProtein ? 30 : 15;
    const remaining = proteinTarget - proteinFromYogurt;

    const displayCupsPerWeek = isHighProtein ? '7' : '3-4';

    const html = `
      <p><strong>To hit your ${proteinTarget}g daily goal:</strong></p>
      <p>
        Use <strong>${servingSize}</strong> of Retaur Protein Yogurt daily as a ${isHighProtein ? 'meal replacement' : 'high-protein snack'}<br>
        → Provides <strong>${proteinFromYogurt}g protein</strong> ${isHighProtein ? '(50g protein per cup)' : '(one serving = 25g)'}<br>
        → That's <strong>${displayCupsPerWeek} cups per week</strong>, <strong>${cupsPerMonth} cups per month</strong>
      </p>
      <p>
        Fill the remaining <strong>${remaining}g</strong> with regular meals:<br>
        <em>Chicken, fish, eggs, beans—your usual protein sources</em>
      </p>
    `;

    this.refs.yogurtRecommendation.innerHTML = html;
  }

  /**
   * Display whey recommendation
   * @param {number} proteinTarget
   */
  displayWheyRecommendation(proteinTarget) {
    const scoopsPerDay = (proteinTarget / 26).toFixed(1);
    const packsPerMonth = Math.ceil((proteinTarget / 26) * 30 / 24);

    const html = `
      <p><strong>To hit ${proteinTarget}g daily:</strong></p>
      <p>
        → You need <strong>${scoopsPerDay} scoops</strong> of whey protein per day<br>
        → That's <strong>${packsPerMonth} ${packsPerMonth === 1 ? 'pack' : 'packs'} per month</strong>
      </p>
      ${parseFloat(scoopsPerDay) < 1 ? '<p><em>Use whey protein to supplement your diet with extra protein daily</em></p>' : ''}
    `;

    this.refs.wheyRecommendation.innerHTML = html;
  }

  /**
   * Display muscle guarantee program recommendation
   * @param {number} proteinTarget
   */
  displayProgramRecommendation(proteinTarget) {
    this.refs.programCard.style.display = 'block';
    this.refs.programProtein.textContent = `${proteinTarget}g`;

    // Track program impression
    this.trackProgramImpression(proteinTarget);
  }

  /**
   * Display combo recommendation
   * @param {number} proteinTarget
   */
  displayComboRecommendation(proteinTarget) {
    this.refs.comboCard.style.display = 'block';

    const isHighProtein = proteinTarget >= 140;
    const yogurtProtein = isHighProtein ? 50 : 25;
    const wheyProtein = 26;
    const totalFromProducts = yogurtProtein + wheyProtein;
    const remaining = proteinTarget - totalFromProducts;

    const html = `
      <ul class="benefit-list">
        <li><strong>${isHighProtein ? '1 cup' : '1/2 cup'}</strong> Protein Yogurt daily = <strong>${yogurtProtein}g protein</strong></li>
        <li><strong>1 scoop</strong> Whey Protein = <strong>${wheyProtein}g protein</strong></li>
      </ul>
      <p>
        <strong>Total: ${totalFromProducts}g from Retaur products</strong><br>
        Fill remaining <strong>${remaining}g</strong> with regular meals
      </p>
    `;

    this.refs.comboRecommendation.innerHTML = html;
  }

  /**
   * Scroll to results section
   */
  scrollToResults() {
    this.refs.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Scroll to top of calculator
   */
  scrollToTop() {
    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Focus first input (sex dropdown)
    setTimeout(() => {
      this.refs.sexInput.focus();
    }, 500);
  }

  /**
   * Announce results to screen readers
   * @param {number} proteinTarget
   */
  announceResults(proteinTarget) {
    this.refs.srAnnouncement.textContent = `Calculation complete. Your daily protein goal is ${proteinTarget} grams. Results are displayed below.`;
  }

  /**
   * Get age range for analytics
   * @param {number} age
   * @returns {string}
   */
  getAgeRange(age) {
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
  }

  /**
   * Track calculator completion
   * @param {number} proteinTarget
   * @param {Object} formData
   */
  trackCalculatorCompletion(proteinTarget, formData) {
    if (typeof window.dataLayer === 'undefined') {
      window.dataLayer = [];
    }

    const showedProgram = formData.goal === 'build_muscle';

    window.dataLayer.push({
      event: 'protein_calculator_completed',
      protein_target: proteinTarget,
      user_goal: formData.goal,
      activity_level: formData.activity,
      showed_program: showedProgram,
      user_sex: formData.sex,
      user_age_range: this.getAgeRange(formData.age),
    });
  }

  /**
   * Track CTA click
   * @param {HTMLElement} button
   */
  trackCTAClick(button) {
    const product = button.getAttribute('data-cta-product');
    const proteinTarget = this.refs.proteinTarget.textContent;

    if (typeof window.dataLayer === 'undefined') {
      window.dataLayer = [];
    }

    let clickPosition = 'secondary';
    if (product === 'yogurt') clickPosition = 'primary';
    if (product === 'muscle_program') clickPosition = 'program';

    window.dataLayer.push({
      event: 'calculator_cta_click',
      product: product,
      protein_target: proteinTarget,
      click_position: clickPosition,
    });
  }

  /**
   * Track program impression
   * @param {number} proteinTarget
   */
  trackProgramImpression(proteinTarget) {
    if (typeof window.dataLayer === 'undefined') {
      window.dataLayer = [];
    }

    window.dataLayer.push({
      event: 'muscle_program_impression',
      protein_target: proteinTarget,
    });
  }

  /**
   * Track validation error
   * @param {string} field
   * @param {string} message
   */
  trackValidationError(field, message) {
    if (typeof window.dataLayer === 'undefined') {
      window.dataLayer = [];
    }

    window.dataLayer.push({
      event: 'calculator_validation_error',
      field_name: field,
      error_message: message,
    });
  }
}

// Register the custom element
customElements.define('protein-calculator', ProteinCalculator);
