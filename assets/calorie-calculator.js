import { Component } from '@theme/component';

/**
 * @typedef {Object} CalorieCalculatorRefs
 * @property {HTMLFormElement} form - Calculator form
 * @property {HTMLSelectElement} sexInput - Biological sex select
 * @property {HTMLInputElement} ageInput - Age input
 * @property {HTMLInputElement} heightInput - Height input (cm)
 * @property {HTMLInputElement} weightInput - Current weight input (kg)
 * @property {HTMLInputElement} goalWeightInput - Goal weight input (kg)
 * @property {HTMLSelectElement} activityInput - Activity level select
 * @property {HTMLElement} sexError - Sex error message
 * @property {HTMLElement} ageError - Age error message
 * @property {HTMLElement} heightError - Height error message
 * @property {HTMLElement} weightError - Weight error message
 * @property {HTMLElement} goalWeightError - Goal weight error message
 * @property {HTMLElement} activityError - Activity error message
 * @property {HTMLElement} resultsSection - Results container
 * @property {HTMLElement} warningBanner - Warning banner
 * @property {HTMLElement} warningText - Warning text content
 * @property {HTMLElement} calorieTarget - Calorie target display
 * @property {HTMLElement} bmrValue - BMR value display
 * @property {HTMLElement} tdeeValue - TDEE value display
 * @property {HTMLElement} deficitValue - Deficit/surplus value display
 * @property {HTMLElement} deficitAdjuster - Deficit adjuster container
 * @property {HTMLElement} deficitAdjusterTitle - Deficit adjuster title
 * @property {HTMLButtonElement} deficitButtonSmall - Small deficit button
 * @property {HTMLButtonElement} deficitButtonModerate - Moderate deficit button
 * @property {HTMLButtonElement} deficitButtonAggressive - Aggressive deficit button
 * @property {HTMLElement} deficitAmountSmall - Small deficit amount text
 * @property {HTMLElement} deficitAmountModerate - Moderate deficit amount text
 * @property {HTMLElement} deficitAmountAggressive - Aggressive deficit amount text
 * @property {HTMLElement} timelineTitle - Timeline section title
 * @property {HTMLElement} currentWeightDisplay - Current weight display
 * @property {HTMLElement} goalWeightDisplay - Goal weight display
 * @property {HTMLElement} weightChangeLabel - Weight change label
 * @property {HTMLElement} weightChangeDisplay - Weight change display
 * @property {HTMLElement} timelineHighlight - Timeline highlight text
 * @property {HTMLElement} timelineEstimate - Timeline estimate text
 * @property {HTMLElement} targetDate - Target date text
 * @property {HTMLElement} proteinGrams - Protein grams display
 * @property {HTMLElement} proteinCalories - Protein calories display
 * @property {HTMLElement} carbGrams - Carb grams display
 * @property {HTMLElement} carbCalories - Carb calories display
 * @property {HTMLElement} fatGrams - Fat grams display
 * @property {HTMLElement} fatCalories - Fat calories display
 * @property {HTMLElement} meal2Calories - 2-meal calories display
 * @property {HTMLElement} meal2Protein - 2-meal protein display
 * @property {HTMLElement} meal2Carbs - 2-meal carbs display
 * @property {HTMLElement} meal2Fats - 2-meal fats display
 * @property {HTMLElement} meal3Calories - 3-meal calories display
 * @property {HTMLElement} meal3Protein - 3-meal protein display
 * @property {HTMLElement} meal3Carbs - 3-meal carbs display
 * @property {HTMLElement} meal3Fats - 3-meal fats display
 * @property {HTMLElement} yogurtHeading - Yogurt heading
 * @property {HTMLElement} yogurtContent - Yogurt content container
 * @property {HTMLElement} wheyHeading - Whey heading
 * @property {HTMLElement} wheyContent - Whey content container
 * @property {HTMLElement} muscleProgram - Muscle program section
 * @property {HTMLElement} muscleProgramContent - Muscle program content
 * @property {HTMLButtonElement} recalculateButton - Recalculate button
 */

/**
 * Calorie Calculator Component
 * Calculates BMR, TDEE, calorie targets, macros, and timeline for weight goals
 * @extends {Component<CalorieCalculatorRefs>}
 */
class CalorieCalculator extends Component {
  static STORAGE_KEY = 'retaur_calorie_calculator_data';

  static ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9,
  };

  static DEFICIT_LEVELS = {
    conservative: 300,
    moderate: 500,
    aggressive: 750,
  };

  static PROTEIN_MULTIPLIERS = {
    lose_weight: 1.8,
    gain_weight: 2.0,
    maintain: 1.6,
  };

  static GOAL_HEADLINES = {
    lose_weight: {
      yogurt: 'Meet Your Calorie & Protein Goals:<br>Retaur Protein Yogurt',
      whey: 'Boost Your Protein Intake:<br>Retaur Whey Protein',
      timeline: 'Your Weight Loss Journey',
      adjuster: 'Adjust Your Calorie Deficit',
    },
    gain_weight: {
      yogurt: 'Add Quality Calories & Protein:<br>Retaur Protein Yogurt',
      whey: 'Easy Calorie Boost:<br>Retaur Whey Protein',
      timeline: 'Your Muscle Building Journey',
      adjuster: 'Adjust Your Calorie Surplus',
    },
    maintain: {
      yogurt: 'Maintain Your Weight While Meeting Protein Needs:<br>Retaur Protein Yogurt',
      whey: 'Meet Your Daily Protein Goals:<br>Retaur Whey Protein',
      timeline: 'Maintenance Plan',
      adjuster: 'Your Maintenance Calories',
    },
  };

  static CALORIES_PER_KG = 7700;

  /**
   * Component initialization
   */
  connectedCallback() {
    super.connectedCallback();

    // State
    this.currentGoal = null;
    this.currentDeficitLevel = 'moderate';
    this.calculatedData = null;

    // Load saved data
    this.loadSavedInputs();

    // Set up event listeners
    this.refs.form.addEventListener('submit', this.handleFormSubmit.bind(this));

    // Validation listeners
    this.refs.sexInput.addEventListener('change', () => this.validateField('sex'));
    this.refs.ageInput.addEventListener('blur', () => this.validateField('age'));
    this.refs.heightInput.addEventListener('blur', () => this.validateField('height'));
    this.refs.weightInput.addEventListener('blur', () => this.validateField('weight'));
    this.refs.goalWeightInput.addEventListener('blur', () => this.validateField('goalWeight'));
    this.refs.activityInput.addEventListener('change', () => this.validateField('activity'));

    // Save inputs on change
    const saveInputs = () => this.saveInputs();
    this.refs.sexInput.addEventListener('change', saveInputs);
    this.refs.ageInput.addEventListener('input', saveInputs);
    this.refs.heightInput.addEventListener('input', saveInputs);
    this.refs.weightInput.addEventListener('input', saveInputs);
    this.refs.goalWeightInput.addEventListener('input', saveInputs);
    this.refs.activityInput.addEventListener('change', saveInputs);

    // Deficit buttons
    this.refs.deficitButtonSmall.addEventListener('click', () => this.handleDeficitChange('conservative'));
    this.refs.deficitButtonModerate.addEventListener('click', () => this.handleDeficitChange('moderate'));
    this.refs.deficitButtonAggressive.addEventListener('click', () => this.handleDeficitChange('aggressive'));

    // Recalculate button
    this.refs.recalculateButton.addEventListener('click', this.handleRecalculate.bind(this));

    // CTA click tracking
    const ctaButtons = this.querySelectorAll('[data-cta-product]');
    for (const button of ctaButtons) {
      button.addEventListener('click', () => {
        this.trackCTAClick(button.dataset.ctaProduct);
      });
    }
  }

  /**
   * Load saved inputs from localStorage
   */
  loadSavedInputs() {
    try {
      const saved = localStorage.getItem(CalorieCalculator.STORAGE_KEY);
      if (!saved) return;

      const data = JSON.parse(saved);
      if (data.sex) this.refs.sexInput.value = data.sex;
      if (data.age) this.refs.ageInput.value = data.age;
      if (data.height) this.refs.heightInput.value = data.height;
      if (data.weight) this.refs.weightInput.value = data.weight;
      if (data.goalWeight) this.refs.goalWeightInput.value = data.goalWeight;
      if (data.activity) this.refs.activityInput.value = data.activity;
      if (data.deficitLevel) this.currentDeficitLevel = data.deficitLevel;
    } catch (error) {
      console.error('Error loading saved data:', error);
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
        goalWeight: this.refs.goalWeightInput.value,
        activity: this.refs.activityInput.value,
        deficitLevel: this.currentDeficitLevel,
      };
      localStorage.setItem(CalorieCalculator.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  /**
   * Validate individual field
   * @param {string} field - Field name
   * @returns {boolean} - Is valid
   */
  validateField(field) {
    let isValid = true;
    let errorMessage = '';

    switch (field) {
      case 'sex':
        if (!this.refs.sexInput.value) {
          isValid = false;
          errorMessage = 'Please select your biological sex';
        }
        this.showError('sexInput', 'sexError', errorMessage);
        break;

      case 'age':
        const age = parseInt(this.refs.ageInput.value);
        if (!age || age < 18 || age > 80) {
          isValid = false;
          errorMessage = 'Please enter your age (must be 18-80)';
        }
        this.showError('ageInput', 'ageError', errorMessage);
        break;

      case 'height':
        const height = parseInt(this.refs.heightInput.value);
        if (!height || height < 120 || height > 250) {
          isValid = false;
          errorMessage = 'Please enter a valid height (120-250 cm)';
        }
        this.showError('heightInput', 'heightError', errorMessage);
        break;

      case 'weight':
        const weight = parseFloat(this.refs.weightInput.value);
        if (!weight || weight < 40 || weight > 200) {
          isValid = false;
          errorMessage = 'Please enter a valid weight (40-200 kg)';
        }
        this.showError('weightInput', 'weightError', errorMessage);
        break;

      case 'goalWeight':
        const goalWeight = parseFloat(this.refs.goalWeightInput.value);
        const currentWeight = parseFloat(this.refs.weightInput.value);
        if (!goalWeight || goalWeight < 40 || goalWeight > 200) {
          isValid = false;
          errorMessage = 'Please enter a valid goal weight (40-200 kg)';
        } else if (currentWeight && goalWeight === currentWeight) {
          isValid = false;
          errorMessage = 'Goal weight must be different from current weight';
        }
        this.showError('goalWeightInput', 'goalWeightError', errorMessage);
        break;

      case 'activity':
        if (!this.refs.activityInput.value) {
          isValid = false;
          errorMessage = 'Please select your activity level';
        }
        this.showError('activityInput', 'activityError', errorMessage);
        break;
    }

    return isValid;
  }

  /**
   * Show/hide error message for a field
   */
  showError(inputRef, errorRef, message) {
    const input = this.refs[inputRef];
    const error = this.refs[errorRef];

    if (message) {
      input.classList.add('error');
      error.textContent = message;
      error.classList.add('visible');
    } else {
      input.classList.remove('error');
      error.textContent = '';
      error.classList.remove('visible');
    }
  }

  /**
   * Validate all form fields
   * @returns {boolean} - All valid
   */
  validateForm() {
    const fields = ['sex', 'age', 'height', 'weight', 'goalWeight', 'activity'];
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
  handleFormSubmit(event) {
    event.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    // Get form values
    const sex = this.refs.sexInput.value;
    const age = parseInt(this.refs.ageInput.value);
    const height = parseInt(this.refs.heightInput.value);
    const weight = parseFloat(this.refs.weightInput.value);
    const goalWeight = parseFloat(this.refs.goalWeightInput.value);
    const activity = this.refs.activityInput.value;

    // Detect goal
    const goal = this.detectGoal(weight, goalWeight);
    this.currentGoal = goal;

    // Calculate BMR and TDEE
    const bmr = this.calculateBMR(sex, age, height, weight);
    const tdee = this.calculateTDEE(bmr, activity);

    // Store calculated data
    this.calculatedData = {
      sex,
      age,
      height,
      weight,
      goalWeight,
      activity,
      goal,
      bmr,
      tdee,
    };

    // Apply moderate deficit by default
    this.displayResults(this.currentDeficitLevel);

    // Track analytics
    this.trackCalculation();

    // Show results
    this.refs.resultsSection.classList.add('visible');

    // Smooth scroll to results
    setTimeout(() => {
      this.refs.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  /**
   * Detect goal from weight difference
   */
  detectGoal(currentWeight, goalWeight) {
    if (goalWeight < currentWeight) {
      return 'lose_weight';
    } else if (goalWeight > currentWeight) {
      return 'gain_weight';
    } else {
      return 'maintain';
    }
  }

  /**
   * Calculate BMR using Mifflin-St Jeor equation
   */
  calculateBMR(sex, age, height, weight) {
    let bmr;
    if (sex === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
    return Math.round(bmr);
  }

  /**
   * Calculate TDEE
   */
  calculateTDEE(bmr, activity) {
    const multiplier = CalorieCalculator.ACTIVITY_MULTIPLIERS[activity];
    return Math.round(bmr * multiplier);
  }

  /**
   * Handle deficit level change
   */
  handleDeficitChange(level) {
    const previousLevel = this.currentDeficitLevel;
    this.currentDeficitLevel = level;

    // Update active button
    this.refs.deficitButtonSmall.classList.remove('active');
    this.refs.deficitButtonModerate.classList.remove('active');
    this.refs.deficitButtonAggressive.classList.remove('active');

    if (level === 'conservative') {
      this.refs.deficitButtonSmall.classList.add('active');
    } else if (level === 'moderate') {
      this.refs.deficitButtonModerate.classList.add('active');
    } else {
      this.refs.deficitButtonAggressive.classList.add('active');
    }

    // Recalculate and update display
    this.displayResults(level);

    // Save to localStorage
    this.saveInputs();

    // Track analytics
    this.trackDeficitChange(previousLevel, level);
  }

  /**
   * Display all results
   */
  displayResults(deficitLevel) {
    const { sex, weight, goalWeight, goal, bmr, tdee } = this.calculatedData;

    // Calculate deficit/surplus
    const deficitAmount = CalorieCalculator.DEFICIT_LEVELS[deficitLevel];
    let dailyCalories;

    if (goal === 'lose_weight') {
      dailyCalories = tdee - deficitAmount;
    } else if (goal === 'gain_weight') {
      dailyCalories = tdee + deficitAmount;
    } else {
      dailyCalories = tdee;
    }

    // Round to nearest 50
    dailyCalories = Math.round(dailyCalories / 50) * 50;

    // Check for minimum calories warning
    this.checkMinimumCalories(sex, dailyCalories, deficitLevel);

    // Update primary metrics
    this.refs.calorieTarget.textContent = `${dailyCalories}`;
    this.refs.bmrValue.textContent = `${bmr} cal`;
    this.refs.tdeeValue.textContent = `${tdee} cal`;

    if (goal === 'lose_weight') {
      this.refs.deficitValue.textContent = `-${deficitAmount} cal`;
    } else if (goal === 'gain_weight') {
      this.refs.deficitValue.textContent = `+${deficitAmount} cal`;
    } else {
      this.refs.deficitValue.textContent = `0 cal`;
    }

    // Update deficit adjuster
    this.updateDeficitAdjuster(goal);

    // Calculate timeline
    this.displayTimeline(weight, goalWeight, goal, dailyCalories, deficitAmount);

    // Calculate macros
    this.displayMacros(weight, goal, dailyCalories);

    // Display products
    this.displayProductRecommendations(goal, weight, dailyCalories);
  }

  /**
   * Check for minimum calorie warnings
   */
  checkMinimumCalories(sex, calories, deficitLevel) {
    let showWarning = false;
    let warningText = '';

    if (sex === 'female' && calories < 1200) {
      showWarning = true;
      warningText = 'This calorie target is below the recommended minimum of 1200 calories for women. We strongly recommend consulting a registered dietitian before following this plan.';
    } else if (sex === 'male' && calories < 1500) {
      showWarning = true;
      warningText = 'This calorie target is below the recommended minimum of 1500 calories for men. We strongly recommend consulting a registered dietitian before following this plan.';
    }

    if (showWarning) {
      this.refs.warningBanner.classList.add('visible');
      this.refs.warningText.textContent = warningText;

      // Track warning shown
      this.trackWarning(calories, sex, deficitLevel);
    } else {
      this.refs.warningBanner.classList.remove('visible');
    }
  }

  /**
   * Update deficit adjuster UI based on goal
   */
  updateDeficitAdjuster(goal) {
    const headlines = CalorieCalculator.GOAL_HEADLINES[goal];
    this.refs.deficitAdjusterTitle.textContent = headlines.adjuster;

    if (goal === 'maintain') {
      // Hide deficit adjuster for maintenance
      this.refs.deficitAdjuster.style.display = 'none';
      return;
    }

    this.refs.deficitAdjuster.style.display = 'block';

    // Update button labels
    if (goal === 'lose_weight') {
      this.refs.deficitAmountSmall.textContent = '-300 cal/day';
      this.refs.deficitAmountModerate.textContent = '-500 cal/day';
      this.refs.deficitAmountAggressive.textContent = '-750 cal/day';
    } else {
      this.refs.deficitAmountSmall.textContent = '+300 cal/day';
      this.refs.deficitAmountModerate.textContent = '+500 cal/day';
      this.refs.deficitAmountAggressive.textContent = '+750 cal/day';
    }
  }

  /**
   * Display timeline section
   */
  displayTimeline(currentWeight, goalWeight, goal, dailyCalories, deficitAmount) {
    const headlines = CalorieCalculator.GOAL_HEADLINES[goal];

    // Update title
    this.refs.timelineTitle.textContent = headlines.timeline;

    // Update weight stats
    this.refs.currentWeightDisplay.textContent = `${currentWeight}kg`;
    this.refs.goalWeightDisplay.textContent = `${goalWeight}kg`;

    const weightChange = Math.abs(goalWeight - currentWeight);

    if (goal === 'lose_weight') {
      this.refs.weightChangeLabel.textContent = 'Weight to lose:';
    } else if (goal === 'gain_weight') {
      this.refs.weightChangeLabel.textContent = 'Weight to gain:';
    } else {
      this.refs.weightChangeLabel.textContent = 'Weight change:';
    }

    this.refs.weightChangeDisplay.textContent = `${weightChange.toFixed(1)}kg`;

    // Calculate timeline
    if (goal !== 'maintain') {
      const weeklyCalories = deficitAmount * 7;
      const totalCaloriesNeeded = weightChange * CalorieCalculator.CALORIES_PER_KG;
      const weeksToGoal = Math.ceil(totalCaloriesNeeded / weeklyCalories);
      const monthsToGoal = Math.round(weeksToGoal / 4.33);
      const weeklyWeightChange = (deficitAmount * 7) / CalorieCalculator.CALORIES_PER_KG;

      // Calculate target date
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + (weeksToGoal * 7));
      const formattedDate = targetDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Update timeline highlight
      const actionVerb = goal === 'lose_weight' ? 'lose' : 'gain';
      this.refs.timelineHighlight.innerHTML = `At <strong>${dailyCalories}</strong> calories per day, you'll ${actionVerb} approximately <strong>${weeklyWeightChange.toFixed(1)}kg</strong> per week`;
      this.refs.timelineEstimate.innerHTML = `Estimated time to goal: <strong>${weeksToGoal} weeks (${monthsToGoal} months)</strong>`;
      this.refs.targetDate.innerHTML = `Target date: <strong>${formattedDate}</strong>`;

      // Check for unrealistic timeline (>2 years)
      if (weeksToGoal > 104) {
        const warningText = document.createElement('p');
        warningText.style.marginTop = '0.5rem';
        warningText.style.color = '#d97706';
        warningText.style.fontWeight = '600';
        warningText.innerHTML = '⚠️ This is a long-term goal. Consider breaking it into smaller milestones.';
        this.refs.targetDate.appendChild(warningText);
      }
    } else {
      this.refs.timelineHighlight.innerHTML = `At <strong>${dailyCalories}</strong> calories per day, you'll maintain your current weight`;
      this.refs.timelineEstimate.innerHTML = '';
      this.refs.targetDate.innerHTML = '';
    }
  }

  /**
   * Display macro breakdown
   */
  displayMacros(weight, goal, dailyCalories) {
    // Calculate protein
    const proteinPerKg = CalorieCalculator.PROTEIN_MULTIPLIERS[goal];
    let proteinGrams = weight * proteinPerKg;
    proteinGrams = Math.round(proteinGrams / 5) * 5;
    const proteinCalories = proteinGrams * 4;

    // Calculate fat (27% of calories)
    let fatCalories = dailyCalories * 0.27;
    let fatGrams = fatCalories / 9;
    fatGrams = Math.round(fatGrams / 5) * 5;
    fatCalories = fatGrams * 9;

    // Calculate carbs (remaining calories)
    let carbCalories = dailyCalories - proteinCalories - fatCalories;
    let carbGrams = carbCalories / 4;
    carbGrams = Math.round(carbGrams / 5) * 5;
    carbCalories = carbGrams * 4;

    // Update macro cards
    this.refs.proteinGrams.textContent = `${proteinGrams}g`;
    this.refs.proteinCalories.textContent = `${Math.round(proteinCalories)} calories`;
    this.refs.carbGrams.textContent = `${carbGrams}g`;
    this.refs.carbCalories.textContent = `${Math.round(carbCalories)} calories`;
    this.refs.fatGrams.textContent = `${fatGrams}g`;
    this.refs.fatCalories.textContent = `${Math.round(fatCalories)} calories`;

    // Update meal breakdown - 2 meals
    this.refs.meal2Calories.textContent = Math.round(dailyCalories / 2);
    this.refs.meal2Protein.textContent = `${Math.round(proteinGrams / 2)}g`;
    this.refs.meal2Carbs.textContent = `${Math.round(carbGrams / 2)}g`;
    this.refs.meal2Fats.textContent = `${Math.round(fatGrams / 2)}g`;

    // Update meal breakdown - 3 meals
    this.refs.meal3Calories.textContent = Math.round(dailyCalories / 3);
    this.refs.meal3Protein.textContent = `${Math.round(proteinGrams / 3)}g`;
    this.refs.meal3Carbs.textContent = `${Math.round(carbGrams / 3)}g`;
    this.refs.meal3Fats.textContent = `${Math.round(fatGrams / 3)}g`;

    // Store for product recommendations
    this.calculatedData.proteinTarget = proteinGrams;
    this.calculatedData.dailyCalories = dailyCalories;
  }

  /**
   * Display product recommendations
   */
  displayProductRecommendations(goal, weight, dailyCalories) {
    const headlines = CalorieCalculator.GOAL_HEADLINES[goal];
    const proteinTarget = this.calculatedData.proteinTarget;

    // Update headings
    this.refs.yogurtHeading.innerHTML = headlines.yogurt;
    this.refs.wheyHeading.innerHTML = headlines.whey;

    // Yogurt recommendation
    if (goal === 'lose_weight' || goal === 'maintain') {
      this.displayYogurtWeightLoss(proteinTarget, dailyCalories);
    } else {
      this.displayYogurtWeightGain(proteinTarget, dailyCalories);
    }

    // Whey recommendation
    this.displayWheyRecommendation(proteinTarget, goal);

    // Muscle Guarantee Program
    if (goal === 'gain_weight' && CalorieCalculator.DEFICIT_LEVELS[this.currentDeficitLevel] >= 300) {
      this.displayMuscleProgram(proteinTarget, dailyCalories, weight);
    } else {
      this.refs.muscleProgram.classList.remove('visible');
    }
  }

  /**
   * Display yogurt recommendation for weight loss/maintenance
   */
  displayYogurtWeightLoss(proteinTarget, dailyCalories) {
    const servingSize = '1/2 cup';
    const proteinFromYogurt = 25;
    const caloriesFromYogurt = 260;
    const servingsPerWeek = 7;
    const servingsPerMonth = 30;

    const proteinPercentage = Math.round((proteinFromYogurt / proteinTarget) * 100);
    const caloriePercentage = Math.round((caloriesFromYogurt / dailyCalories) * 100);

    const html = `
      <p>Losing weight means eating fewer calories while maintaining protein to preserve muscle. Our Protein Yogurt gives you 25g of protein for only 260 calories per serving—perfect as a meal replacement that keeps you full without breaking your calorie budget.</p>

      <ul class="product-benefits">
        <li>260 calories per serving (controlled portion)</li>
        <li>25g protein keeps you full longer</li>
        <li>Gut-friendly probiotics support digestion</li>
        <li>Ready-to-eat convenience (no cooking when hungry)</li>
        <li>Satisfies sweet cravings without empty calories</li>
      </ul>

      <div class="product-recommendation">
        <p><strong>To hit your ${proteinTarget}g protein goal within ${dailyCalories} calories:</strong></p>
        <p>
          → Use <strong>${servingSize}</strong> Retaur Protein Yogurt per day<br>
          → That's <strong>25g protein, 260 calories</strong><br>
          → <strong>${servingsPerWeek} servings per week, ${servingsPerMonth} servings per month</strong>
        </p>
        <p>This covers <strong>${proteinPercentage}%</strong> of your daily protein in just <strong>${caloriePercentage}%</strong> of your calories.</p>
        <p><em>Fill remaining macros with lean proteins (chicken, fish, eggs), vegetables and whole grains, and healthy fats (avocado, nuts).</em></p>
      </div>
    `;

    this.refs.yogurtContent.innerHTML = html;
  }

  /**
   * Display yogurt recommendation for weight gain
   */
  displayYogurtWeightGain(proteinTarget, dailyCalories) {
    const servingSize = '1 cup';
    const proteinFromYogurt = 50;
    const caloriesFromYogurt = 520;
    const cupsPerWeek = 7;
    const cupsPerMonth = 30;

    const proteinPercentage = Math.round((proteinFromYogurt / proteinTarget) * 100);
    const caloriePercentage = Math.round((caloriesFromYogurt / dailyCalories) * 100);

    const html = `
      <p>Building muscle requires eating more calories than you burn. But the quality of those calories matters. Our Protein Yogurt gives you 50g of protein and 520 calories per cup—nutrient-dense fuel that supports muscle growth, not just weight gain.</p>

      <ul class="product-benefits">
        <li>520 calories per cup (easy calories without getting stuffed)</li>
        <li>50g protein supports muscle protein synthesis</li>
        <li>Carbs help replenish glycogen post-workout</li>
        <li>Probiotics aid nutrient absorption</li>
        <li>Easy to eat even when not hungry</li>
      </ul>

      <div class="product-recommendation">
        <p><strong>To hit your ${proteinTarget}g protein goal within ${dailyCalories} calories:</strong></p>
        <p>
          → Use <strong>${servingSize}</strong> of Retaur Protein Yogurt daily<br>
          → That's <strong>50g protein, 520 calories</strong><br>
          → <strong>${cupsPerWeek} cups per week, ${cupsPerMonth} cups per month</strong>
        </p>
        <p>This covers <strong>${proteinPercentage}%</strong> of your daily protein and <strong>${caloriePercentage}%</strong> of your calorie surplus.</p>
        <p><em>Fill remaining calories with complex carbs (rice, oats, sweet potato), healthy fats (nuts, olive oil, avocado), and lean proteins (chicken, beef, fish).</em></p>
      </div>
    `;

    this.refs.yogurtContent.innerHTML = html;
  }

  /**
   * Display whey protein recommendation
   */
  displayWheyRecommendation(proteinTarget, goal) {
    const minScoops = 1;
    const maxScoops = 2;
    const proteinPerScoop = 26;
    const caloriesPerScoop = 120;
    const minProtein = minScoops * proteinPerScoop;
    const maxProtein = maxScoops * proteinPerScoop;
    const minCalories = minScoops * caloriesPerScoop;
    const maxCalories = maxScoops * caloriesPerScoop;

    const packsPerMonthMin = Math.ceil((minScoops * 30) / 24);
    const packsPerMonthMax = Math.ceil((maxScoops * 30) / 24);

    let description = '';
    if (goal === 'lose_weight') {
      description = '<p>Prefer protein shakes? Retaur Whey Protein gives you 26g of protein for only ~120 calories per scoop.</p>';
    } else if (goal === 'gain_weight') {
      description = '<p>Looking for an easy calorie boost? Add Retaur Whey Protein to smoothies with milk, banana, and peanut butter for a 500+ calorie shake.</p>';
    } else {
      description = '<p>Meet your protein goals effortlessly with Retaur Whey Protein—26g of protein per scoop.</p>';
    }

    const html = `
      ${description}

      <div class="product-recommendation">
        <p><strong>Supplement your diet with whey protein:</strong></p>
        <p>
          → Add <strong>1-2 scoops per day</strong> (${minProtein}g-${maxProtein}g protein)<br>
          → That's <strong>${minCalories}-${maxCalories} calories</strong> per day<br>
          → <strong>${packsPerMonthMin}-${packsPerMonthMax} packs per month</strong>
        </p>
        <p><em>Use whey protein to boost your daily intake alongside regular meals${goal === 'lose_weight' ? '. Mix with water for a lower-calorie option' : ''}.</em></p>
      </div>
    `;

    this.refs.wheyContent.innerHTML = html;
  }

  /**
   * Display Muscle Guarantee Program
   */
  displayMuscleProgram(proteinTarget, dailyCalories, weightToGain) {
    const html = `
      <p>You need to eat ${dailyCalories} calories daily with ${proteinTarget}g protein to gain ${weightToGain.toFixed(1)}kg. That's the nutrition piece. But what about your training program? Your meal plans? The accountability to stay consistent?</p>

      <p>Our Muscle Guarantee Program gives you everything:</p>

      <ul>
        <li>6-month supply of whey protein + creatine</li>
        <li>Certified coach & monthly video calls</li>
        <li>Personalized meal plans to hit your ${dailyCalories} calorie target</li>
        <li>Custom training program for muscle growth</li>
        <li>24/7 WhatsApp community support</li>
      </ul>

      <p><strong>We pay you ₦200,000 when you gain 3cm+ on 2 body parts.</strong><br>
      72% of members succeed and get the cashback.</p>

      <p>Premium: ₦400,000 + ₦200k cashback | Standard: ₦260,000<br>
      Limited to 50 spots • Starts January 31, 2026</p>
    `;

    this.refs.muscleProgramContent.innerHTML = html;
    this.refs.muscleProgram.classList.add('visible');
  }

  /**
   * Handle recalculate button
   */
  handleRecalculate() {
    // Scroll back to form
    this.refs.form.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Hide results
    setTimeout(() => {
      this.refs.resultsSection.classList.remove('visible');
    }, 500);
  }

  /**
   * Track calculation completion
   */
  trackCalculation() {
    if (typeof window.dataLayer === 'undefined') {
      window.dataLayer = [];
    }

    const { goal, tdee, activity } = this.calculatedData;
    const dailyCalories = this.calculatedData.dailyCalories || tdee;

    window.dataLayer.push({
      event: 'calorie_calculator_completed',
      calorie_target: dailyCalories,
      user_goal: goal,
      deficit_level: this.currentDeficitLevel,
      activity_level: activity,
    });
  }

  /**
   * Track deficit level change
   */
  trackDeficitChange(fromLevel, toLevel) {
    if (typeof window.dataLayer === 'undefined') {
      window.dataLayer = [];
    }

    window.dataLayer.push({
      event: 'calorie_calculator_deficit_changed',
      from_level: fromLevel,
      to_level: toLevel,
      new_calories: this.calculatedData.dailyCalories,
    });
  }

  /**
   * Track CTA click
   */
  trackCTAClick(product) {
    if (typeof window.dataLayer === 'undefined') {
      window.dataLayer = [];
    }

    window.dataLayer.push({
      event: 'calorie_calculator_cta_click',
      product: product,
      user_goal: this.currentGoal,
      calorie_target: this.calculatedData.dailyCalories,
    });
  }

  /**
   * Track warning shown
   */
  trackWarning(calories, sex, deficitLevel) {
    if (typeof window.dataLayer === 'undefined') {
      window.dataLayer = [];
    }

    window.dataLayer.push({
      event: 'calorie_calculator_warning_shown',
      warning_type: 'minimum_calories',
      calories: calories,
      sex: sex,
      deficit_level: deficitLevel,
    });
  }
}

customElements.define('calorie-calculator', CalorieCalculator);
