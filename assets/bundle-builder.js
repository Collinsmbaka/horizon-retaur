import { Component } from '@theme/component';
import { fetchConfig } from '@theme/utilities';
import { ThemeEvents, CartAddEvent, VariantUpdateEvent } from '@theme/events';

/**
 * Bundle Builder Component
 * Handles yogurt bundle selection with granola upsell
 *
 * @typedef {Object} BundleBuilderRefs
 * @property {HTMLButtonElement} tabWithout - Without granola tab button
 * @property {HTMLButtonElement} tabWith - With granola tab button
 * @property {HTMLDivElement} granolaSection - Granola selection section
 * @property {HTMLDivElement} granolaLine - Granola price line in summary
 * @property {HTMLInputElement} granolaInput - Granola quantity input
 * @property {HTMLButtonElement} decreaseBtn - Decrease granola quantity button
 * @property {HTMLButtonElement} increaseBtn - Increase granola quantity button
 * @property {HTMLDivElement} quantityGrid - Bundle quantity grid
 * @property {HTMLSpanElement} bundlePrice - Bundle price display
 * @property {HTMLSpanElement} granolaPrice - Granola price display
 * @property {HTMLSpanElement} totalPrice - Total price display
 * @property {HTMLButtonElement} addToCartBtn - Add to cart button
 * @property {HTMLScriptElement} variantData - Variant data JSON
 *
 * @extends {Component<BundleBuilderRefs>}
 */
class BundleBuilderComponent extends Component {
  requiredRefs = [
    'tabWithout',
    'tabWith',
    'granolaSection',
    'granolaLine',
    'granolaInput',
    'decreaseBtn',
    'increaseBtn',
    'quantityGrid',
    'bundlePrice',
    'granolaPrice',
    'totalPrice',
    'addToCartBtn',
    'variantData',
  ];

  /** @type {Object} */
  #variantData;

  /** @type {string} */
  #currentTab = 'without-granola';

  /** @type {Object} */
  #selectedVariant = null;

  /** @type {string} */
  #currentSize = null;

  connectedCallback() {
    super.connectedCallback();

    // Parse variant data
    this.#variantData = JSON.parse(this.refs.variantData.textContent);

    // Set initial state
    this.#initializeState();

    // Listen for variant updates from the main variant picker
    const section = this.closest('.shopify-section');
    if (section) {
      section.addEventListener(ThemeEvents.variantUpdate, this.#handleVariantUpdate);
    }
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
      this.#updatePricing();
    }
  };

  /**
   * Update quantity buttons with new prices for current size
   */
  #updateQuantityButtons() {
    const buttons = this.refs.quantityGrid.querySelectorAll('.bundle-builder__quantity-btn');

    buttons.forEach((btn) => {
      const quantity = btn.dataset.quantity;
      const variant = this.#variantData.variants.find(
        (v) => v.size === this.#currentSize && v.quantity === quantity
      );

      if (variant) {
        btn.dataset.variantId = variant.id;
        btn.dataset.price = variant.price;
        btn.dataset.size = variant.size;

        const priceEl = btn.querySelector('.bundle-builder__quantity-price');
        if (priceEl) {
          priceEl.textContent = this.#formatMoney(variant.price);
        }

        // Update button state if it's the selected one
        if (quantity === this.#selectedVariant?.quantity) {
          btn.classList.add('bundle-builder__quantity-btn--active');
        }
      }
    });
  }

  /**
   * Handle tab click
   * @param {MouseEvent} event
   */
  handleEvent(event) {
    const target = event.target;

    // Tab switching
    if (target.matches('[data-tab]')) {
      this.#switchTab(target.dataset.tab);
      return;
    }

    // Quantity button click
    if (target.closest('.bundle-builder__quantity-btn')) {
      const btn = target.closest('.bundle-builder__quantity-btn');
      this.#selectQuantity(btn);
      return;
    }

    // Granola quantity controls
    if (target.matches('[data-action="decrease"]') || target.closest('[data-action="decrease"]')) {
      this.#changeGranolaQuantity(-1);
      return;
    }

    if (target.matches('[data-action="increase"]') || target.closest('[data-action="increase"]')) {
      this.#changeGranolaQuantity(1);
      return;
    }

    // Add to cart
    if (target === this.refs.addToCartBtn || target.closest('button') === this.refs.addToCartBtn) {
      event.preventDefault();
      this.#addToCart();
      return;
    }
  }

  /**
   * Switch between tabs
   * @param {string} tab
   */
  #switchTab(tab) {
    this.#currentTab = tab;

    // Update tab buttons
    this.refs.tabWithout.classList.toggle('bundle-builder__tab--active', tab === 'without-granola');
    this.refs.tabWith.classList.toggle('bundle-builder__tab--active', tab === 'with-granola');

    // Show/hide granola section
    const showGranola = tab === 'with-granola';
    this.refs.granolaSection.style.display = showGranola ? 'flex' : 'none';
    this.refs.granolaLine.style.display = showGranola ? 'flex' : 'none';

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
    };

    this.#updatePricing();
  }

  /**
   * Change granola quantity
   * @param {number} delta
   */
  #changeGranolaQuantity(delta) {
    const input = this.refs.granolaInput;
    const currentValue = parseInt(input.value) || 1;
    const newValue = Math.max(1, Math.min(parseInt(this.dataset.maxGranola), currentValue + delta));

    input.value = newValue;
    this.#updatePricing();
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

    // Update granola price (if visible)
    if (this.#currentTab === 'with-granola') {
      this.refs.granolaPrice.textContent = this.#formatMoney(granolaTotal);
      this.refs.totalPrice.textContent = this.#formatMoney(bundlePrice + granolaTotal);
    } else {
      this.refs.totalPrice.textContent = this.#formatMoney(bundlePrice);
    }

    // Update button states
    this.refs.decreaseBtn.disabled = granolaQuantity <= 1;
    this.refs.increaseBtn.disabled = granolaQuantity >= parseInt(this.dataset.maxGranola);
  }

  /**
   * Add items to cart
   */
  async #addToCart() {
    if (!this.#selectedVariant) {
      console.error('No variant selected');
      return;
    }

    const btn = this.refs.addToCartBtn;
    const originalText = btn.textContent;

    try {
      // Disable button
      btn.disabled = true;
      btn.textContent = 'Adding...';

      // Prepare items array
      const items = [
        {
          id: this.#selectedVariant.id,
          quantity: 1,
        },
      ];

      // Add granola if with-granola tab is active
      if (this.#currentTab === 'with-granola') {
        const granolaQuantity = parseInt(this.refs.granolaInput.value) || 1;
        items.push({
          id: this.dataset.granolaVariantId,
          quantity: granolaQuantity,
        });
      }

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

      // Success feedback
      btn.textContent = 'Added!';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      btn.textContent = 'Error - Try Again';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
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
