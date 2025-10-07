import { Component } from '@theme/component';
import { fetchConfig } from '@theme/utilities';

/**
 * Granola Add-on Component
 * Simple component to add granola to cart alongside main product
 *
 * @typedef {Object} GranolaAddonRefs
 * @property {HTMLInputElement} granolaCheckbox - Granola toggle checkbox
 * @property {HTMLDivElement} granolaControls - Granola quantity controls
 * @property {HTMLInputElement} granolaInput - Granola quantity input
 * @property {HTMLButtonElement} decreaseBtn - Decrease button
 * @property {HTMLButtonElement} increaseBtn - Increase button
 *
 * @extends {Component<GranolaAddonRefs>}
 */
class GranolaAddonComponent extends Component {
  requiredRefs = ['granolaCheckbox', 'granolaControls', 'granolaInput', 'decreaseBtn', 'increaseBtn'];

  connectedCallback() {
    super.connectedCallback();

    // Intercept product form submission
    const productForm = this.closest('.shopify-section')?.querySelector('product-form-component');
    if (productForm) {
      const form = productForm.querySelector('form');
      if (form) {
        form.addEventListener('submit', this.#interceptFormSubmit.bind(this));
      }
    }
  }

  /**
   * Handle click events
   * @param {MouseEvent} event
   */
  handleEvent(event) {
    const target = event.target;

    // Checkbox toggle
    if (target === this.refs.granolaCheckbox) {
      this.#toggleGranola();
      return;
    }

    // Decrease button
    if (target.closest('[data-action="decrease"]')) {
      event.preventDefault();
      this.#changeQuantity(-1);
      return;
    }

    // Increase button
    if (target.closest('[data-action="increase"]')) {
      event.preventDefault();
      this.#changeQuantity(1);
      return;
    }
  }

  /**
   * Toggle granola controls
   */
  #toggleGranola() {
    const isChecked = this.refs.granolaCheckbox.checked;
    this.refs.granolaControls.style.display = isChecked ? 'flex' : 'none';
  }

  /**
   * Change granola quantity
   * @param {number} delta
   */
  #changeQuantity(delta) {
    const input = this.refs.granolaInput;
    const currentValue = parseInt(input.value) || 1;
    const newValue = Math.max(1, currentValue + delta);

    input.value = newValue;
    this.refs.decreaseBtn.disabled = newValue <= 1;
  }

  /**
   * Intercept form submission to add granola if checked
   * @param {Event} event
   */
  async #interceptFormSubmit(event) {
    // Only intercept if granola is checked
    if (!this.refs.granolaCheckbox.checked) {
      return; // Let normal form submission happen
    }

    event.preventDefault();
    event.stopPropagation();

    try {
      // Get form data for main product
      const form = event.target;
      const formData = new FormData(form);
      const mainProductVariantId = formData.get('id');
      const granolaQuantity = parseInt(this.refs.granolaInput.value) || 1;

      // Prepare items array
      const items = [
        {
          id: mainProductVariantId,
          quantity: 1,
        },
        {
          id: this.dataset.granolaVariantId,
          quantity: granolaQuantity,
        },
      ];

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

      // Dispatch cart add event for cart drawer/icon update
      const CartAddEvent = new CustomEvent('theme:cart:add', {
        bubbles: true,
        detail: data,
      });
      this.dispatchEvent(CartAddEvent);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }
}

if (!customElements.get('granola-addon-component')) {
  customElements.define('granola-addon-component', GranolaAddonComponent);
}
