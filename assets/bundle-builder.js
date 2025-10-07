import { Component } from '@theme/component';
import { fetchConfig } from '@theme/utilities';
import { ThemeEvents, CartAddEvent, VariantUpdateEvent } from '@theme/events';

/**
 * Bundle Builder Component
 * Handles yogurt bundle selection with granola upsell
 *
 * @typedef {Object} BundleBuilderRefs
 * @property {HTMLInputElement} granolaCheckbox - Granola toggle checkbox
 * @property {HTMLDivElement} granolaControls - Granola quantity controls container
 * @property {HTMLDivElement} granolaLine - Granola price line in summary
 * @property {HTMLSpanElement} granolaQtyText - Granola quantity text in summary
 * @property {HTMLInputElement} granolaInput - Granola quantity input
 * @property {HTMLButtonElement} decreaseBtn - Decrease granola quantity button
 * @property {HTMLButtonElement} increaseBtn - Increase granola quantity button
 * @property {HTMLDivElement} quantityGrid - Bundle quantity grid
 * @property {HTMLDivElement} savingsDisplay - Savings message container
 * @property {HTMLSpanElement} savingsText - Savings message text
 * @property {HTMLSpanElement} bundlePrice - Bundle price display
 * @property {HTMLSpanElement} granolaPrice - Granola price display
 * @property {HTMLSpanElement} totalPrice - Total price display
 * @property {HTMLScriptElement} variantData - Variant data JSON
 *
 * @extends {Component<BundleBuilderRefs>}
 */
class BundleBuilderComponent extends Component {
  requiredRefs = [
    'granolaCheckbox',
    'granolaControls',
    'granolaLine',
    'granolaQtyText',
    'granolaInput',
    'decreaseBtn',
    'increaseBtn',
    'quantityGrid',
    'savingsDisplay',
    'savingsText',
    'bundlePrice',
    'granolaPrice',
    'totalPrice',
    'variantData',
  ];

  /** @type {Object} */
  #variantData;

  /** @type {Object} */
  #selectedVariant = null;

  /** @type {string} */
  #currentSize = null;

  /** @type {boolean} */
  #granolaEnabled = false;

  connectedCallback() {
    super.connectedCallback();

    // Parse variant data
    this.#variantData = JSON.parse(this.refs.variantData.textContent);

    // Set initial state
    this.#initializeState();

    // Add explicit event listeners for better compatibility
    this.addEventListener('click', this.#handleClick.bind(this));
    this.addEventListener('change', this.#handleChange.bind(this));

    // Listen for variant updates from the main variant picker
    const section = this.closest('.shopify-section');
    if (section) {
      section.addEventListener(ThemeEvents.variantUpdate, this.#handleVariantUpdate);
    }

    // Intercept the product form submission to add granola if needed
    const productForm = this.closest('.shopify-section')?.querySelector('product-form-component');
    if (productForm) {
      const form = productForm.querySelector('form');
      if (form) {
        form.addEventListener('submit', this.#interceptFormSubmit.bind(this));
      }
    }

    // Hide the Quantity option from the variant picker
    this.#hideQuantityVariantPicker();
  }

  /**
   * Hide the Quantity variant picker since bundle builder handles it
   */
  #hideQuantityVariantPicker() {
    const section = this.closest('.shopify-section');
    if (!section) return;

    const variantPicker = section.querySelector('variant-picker');
    if (!variantPicker) return;

    // Find all fieldsets and hide the one with "Quantity" in the legend
    const fieldsets = variantPicker.querySelectorAll('fieldset.variant-option');
    fieldsets.forEach((fieldset) => {
      const legend = fieldset.querySelector('legend');
      if (legend && legend.textContent.toLowerCase().includes('quantity')) {
        fieldset.style.display = 'none';
      }
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    const section = this.closest('.shopify-section');
    if (section) {
      section.removeEventListener(ThemeEvents.variantUpdate, this.#handleVariantUpdate);
    }
  }

  /**
   * Initialize component state
   */
  #initializeState() {
    // Get the first active quantity button (should be 1x by default)
    const activeBtn = this.refs.quantityGrid.querySelector('.bundle-builder__quantity-btn--active');
    if (activeBtn) {
      this.#selectedVariant = {
        id: activeBtn.dataset.variantId,
        quantity: activeBtn.dataset.quantity,
        price: parseInt(activeBtn.dataset.price),
        size: activeBtn.dataset.size,
      };
      this.#currentSize = activeBtn.dataset.size;
    }

    this.#updatePricing();
  }

  /**
   * Handle variant update from main variant picker (size change)
   * @param {CustomEvent} event
   */
  #handleVariantUpdate = (event) => {
    const { variant } = event.detail;

    if (!variant) return;

    // Update current size
    this.#currentSize = variant.option1;

    // Update quantity buttons to show prices for new size
    this.#updateQuantityButtons();

    // Update selected variant to maintain same quantity but new size
    const currentQuantity = this.#selectedVariant?.quantity || '1';
    const newVariant = this.#variantData.variants.find(
      (v) => v.size === this.#currentSize && v.quantity === currentQuantity
    );

    if (newVariant) {
      this.#selectedVariant = newVariant;
      this.#updateProductFormVariant();
      this.#updateSavings();
      this.#updatePricing();
    }

    // Re-hide the quantity picker in case it reappeared
    setTimeout(() => {
      this.#hideQuantityVariantPicker();
    }, 100);
  };

  /**
   * Update quantity buttons with new prices for current size
   */
  #updateQuantityButtons() {
    const buttons = this.refs.quantityGrid.querySelectorAll('.bundle-builder__quantity-btn');

    buttons.forEach((btn) => {
      const quantity = btn.dataset.quantity;
      const variant = this.#variantData.variants.find(
        (v) => String(v.size) === String(this.#currentSize) && String(v.quantity) === String(quantity)
      );

      if (variant) {
        btn.dataset.variantId = variant.id;
        btn.dataset.price = variant.price;
        btn.dataset.size = variant.size;
        btn.dataset.comparePrice = variant.comparePrice || '';

        const priceEl = btn.querySelector('.bundle-builder__quantity-price');
        if (priceEl) {
          priceEl.textContent = this.#formatMoney(variant.price);
        }

        // Update image if exists
        const imgEl = btn.querySelector('.bundle-builder__quantity-image');
        if (imgEl && variant.image) {
          imgEl.src = variant.image;
          imgEl.alt = `${quantity}x ${variant.size}`;
        }

        // Update button state if it's the selected one
        if (String(quantity) === String(this.#selectedVariant?.quantity)) {
          btn.classList.add('bundle-builder__quantity-btn--active');
        }
      } else {
        console.warn('Variant not found for size:', this.#currentSize, 'quantity:', quantity);
      }
    });
  }

  /**
   * Handle click events
   * @param {MouseEvent} event
   */
  #handleClick(event) {
    const target = event.target;

    // Quantity button click
    if (target.closest('.bundle-builder__quantity-btn')) {
      event.preventDefault();
      const btn = target.closest('.bundle-builder__quantity-btn');
      this.#selectQuantity(btn);
      return;
    }

    // Granola quantity controls
    if (target.matches('[data-action="decrease"]') || target.closest('[data-action="decrease"]')) {
      event.preventDefault();
      this.#changeGranolaQuantity(-1);
      return;
    }

    if (target.matches('[data-action="increase"]') || target.closest('[data-action="increase"]')) {
      event.preventDefault();
      this.#changeGranolaQuantity(1);
      return;
    }
  }

  /**
   * Handle change events
   * @param {Event} event
   */
  #handleChange(event) {
    const target = event.target;

    // Granola checkbox toggle
    if (target === this.refs.granolaCheckbox) {
      this.#toggleGranola();
      return;
    }

    // Granola input change
    if (target === this.refs.granolaInput) {
      this.#updatePricing();
      return;
    }
  }

  /**
   * Handle events (kept for compatibility with Component base class)
   * @param {MouseEvent | Event} event
   */
  handleEvent(event) {
    // Delegate to specific handlers
    if (event.type === 'click') {
      this.#handleClick(event);
    } else if (event.type === 'change') {
      this.#handleChange(event);
    }
  }

  /**
   * Toggle granola option
   */
  #toggleGranola() {
    this.#granolaEnabled = this.refs.granolaCheckbox.checked;

    // Show/hide granola controls
    this.refs.granolaControls.style.display = this.#granolaEnabled ? 'flex' : 'none';
    this.refs.granolaLine.style.display = this.#granolaEnabled ? 'flex' : 'none';

    this.#updatePricing();
  }

  /**
   * Select a bundle quantity
   * @param {HTMLButtonElement} btn
   */
  #selectQuantity(btn) {
    // Remove active class from all buttons
    this.refs.quantityGrid
      .querySelectorAll('.bundle-builder__quantity-btn')
      .forEach((b) => b.classList.remove('bundle-builder__quantity-btn--active'));

    // Add active class to selected button
    btn.classList.add('bundle-builder__quantity-btn--active');

    // Update selected variant
    this.#selectedVariant = {
      id: btn.dataset.variantId,
      quantity: btn.dataset.quantity,
      price: parseInt(btn.dataset.price),
      size: btn.dataset.size,
      comparePrice: btn.dataset.comparePrice ? parseInt(btn.dataset.comparePrice) : null,
    };

    // Update the product form's variant ID
    this.#updateProductFormVariant();

    this.#updateSavings();
    this.#updatePricing();
  }

  /**
   * Update the product form's variant ID input
   */
  #updateProductFormVariant() {
    if (!this.#selectedVariant) return;

    const productForm = this.closest('.shopify-section')?.querySelector('product-form-component');
    if (productForm) {
      const variantInput = productForm.querySelector('input[name="id"]');
      if (variantInput) {
        variantInput.value = this.#selectedVariant.id;
      }
    }
  }

  /**
   * Change granola quantity
   * @param {number} delta
   */
  #changeGranolaQuantity(delta) {
    const input = this.refs.granolaInput;
    const currentValue = parseInt(input.value) || 1;
    const newValue = Math.max(1, currentValue + delta);

    input.value = newValue;
    this.#updatePricing();
  }

  /**
   * Update savings display
   */
  #updateSavings() {
    if (!this.#selectedVariant) return;

    const { price, comparePrice, quantity } = this.#selectedVariant;

    // Only show savings if compare_at_price is set and higher than price
    if (comparePrice && comparePrice > price) {
      const savings = comparePrice - price;
      this.refs.savingsDisplay.style.display = 'flex';
      this.refs.savingsText.textContent = `Save ${this.#formatMoney(savings)} on ${quantity}x bundle!`;
    } else {
      this.refs.savingsDisplay.style.display = 'none';
    }
  }

  /**
   * Update pricing display
   */
  #updatePricing() {
    if (!this.#selectedVariant) return;

    const bundlePrice = this.#selectedVariant.price;
    const granolaQuantity = parseInt(this.refs.granolaInput.value) || 1;
    const granolaUnitPrice = parseInt(this.dataset.granolaPrice) || 0;
    const granolaTotal = granolaUnitPrice * granolaQuantity;

    // Update bundle price
    this.refs.bundlePrice.textContent = this.#formatMoney(bundlePrice);

    // Update granola price (if enabled)
    if (this.#granolaEnabled) {
      this.refs.granolaQtyText.textContent = `(x${granolaQuantity})`;
      this.refs.granolaPrice.textContent = this.#formatMoney(granolaTotal);
      this.refs.totalPrice.textContent = this.#formatMoney(bundlePrice + granolaTotal);
    } else {
      this.refs.totalPrice.textContent = this.#formatMoney(bundlePrice);
    }

    // Update button states
    this.refs.decreaseBtn.disabled = granolaQuantity <= 1;
  }

  /**
   * Intercept product form submission to add granola if needed
   * @param {Event} event
   */
  async #interceptFormSubmit(event) {
    // Only intercept if granola is enabled
    if (!this.#granolaEnabled) {
      return; // Let the normal form submission happen
    }

    event.preventDefault();
    event.stopPropagation();

    if (!this.#selectedVariant) {
      console.error('No variant selected');
      return;
    }

    try {
      // Prepare items array - bundle + granola
      const items = [
        {
          id: this.#selectedVariant.id,
          quantity: 1,
        },
      ];

      const granolaQuantity = parseInt(this.refs.granolaInput.value) || 1;
      items.push({
        id: this.dataset.granolaVariantId,
        quantity: granolaQuantity,
      });

      // Add items to cart
      const config = fetchConfig('javascript');
      const response = await fetch(Theme.routes.cart_add_url, {
        ...config,
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (data.status && data.status !== 200) {
        throw new Error(data.message || 'Failed to add to cart');
      }

      // Dispatch cart add event
      this.dispatchEvent(
        new CartAddEvent(data, this.dataset.sectionId, {
          source: 'bundle-builder',
          itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
          productId: this.dataset.productId,
        })
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Let the error be handled by the product form component
    }
  }

  /**
   * Format money using Shopify format
   * @param {number} cents
   * @returns {string}
   */
  #formatMoney(cents) {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  }
}

if (!customElements.get('bundle-builder-component')) {
  customElements.define('bundle-builder-component', BundleBuilderComponent);
}
