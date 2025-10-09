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

    // Listen for checkbox changes
    this.refs.granolaCheckbox.addEventListener('change', this.#toggleGranola.bind(this));

    // Listen for button clicks
    this.refs.decreaseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.#changeQuantity(-1);
    });

    this.refs.increaseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.#changeQuantity(1);
    });

    // Intercept product form submission - use capture phase for higher priority
    setTimeout(() => {
      const productForm = this.closest('.shopify-section')?.querySelector('product-form-component');
      if (productForm) {
        const form = productForm.querySelector('form[data-type="add-to-cart-form"]');
        if (form) {
          console.log('Granola addon: Found form, attaching listener');
          form.addEventListener('submit', this.#interceptFormSubmit.bind(this), { capture: true });
        } else {
          console.warn('Granola addon: Could not find add-to-cart form');
        }
      }
    }, 100);
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
    console.log('Granola addon: Form submit intercepted', {
      checked: this.refs.granolaCheckbox.checked,
    });

    // Only intercept if granola is checked
    if (!this.refs.granolaCheckbox.checked) {
      console.log('Granola addon: Not checked, allowing normal submission');
      return; // Let normal form submission happen
    }

    // Don't prevent default - let the main product form submit normally
    // We'll just add granola after the form submits successfully
    console.log('Granola addon: Allowing main product to be added, will add granola after');

    // Wait a bit for the main product to be added to cart
    setTimeout(async () => {
      try {
        const granolaQuantity = parseInt(this.refs.granolaInput.value) || 1;
        // Parse variant ID and convert to number
        const granolaVariantIdString = String(this.dataset.granolaVariantId || '').trim().split(/\s+/)[0];
        const granolaVariantId = parseInt(granolaVariantIdString, 10);

        console.log('Granola addon: Adding granola to cart', {
          granolaVariantIdRaw: this.dataset.granolaVariantId,
          granolaVariantIdString,
          granolaVariantId,
          granolaQuantity,
        });

        // Add granola to cart using Shopify's form data format
        const formData = new FormData();
        formData.append('id', granolaVariantId);
        formData.append('quantity', granolaQuantity);

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData,
        });

        console.log('Granola addon: Granola response status', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Granola addon: Granola added successfully', data);

          // Trigger a cart update event
          document.dispatchEvent(new CustomEvent('cart:refresh'));
        } else {
          const errorText = await response.text();
          console.error('Granola addon: Failed to add granola', {
            status: response.status,
            error: errorText,
          });
        }
      } catch (error) {
        console.error('Granola addon: Error adding granola:', error);
      }
    }, 500);
  }
}

if (!customElements.get('granola-addon-component')) {
  customElements.define('granola-addon-component', GranolaAddonComponent);
}
