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

    console.log('Granola addon: Intercepting and adding granola to cart');
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    try {
      // Get form data for main product
      const form = event.target;
      const formData = new FormData(form);
      const mainProductVariantId = formData.get('id');
      const mainProductQuantity = parseInt(formData.get('quantity')) || 1;
      const granolaQuantity = parseInt(this.refs.granolaInput.value) || 1;

      // Parse granola variant ID properly (remove any whitespace and ensure it's a valid number)
      const granolaVariantId = String(this.dataset.granolaVariantId || '').trim().split(/\s+/)[0];

      console.log('Granola addon: Adding items', {
        mainProductVariantId,
        mainProductQuantity,
        granolaVariantIdRaw: this.dataset.granolaVariantId,
        granolaVariantIdParsed: granolaVariantId,
        granolaQuantity,
      });

      // Add items to cart sequentially (Shopify Ajax API works better this way)
      const config = fetchConfig('javascript');

      // First, add the main product
      console.log('Granola addon: Adding main product to cart');
      const mainResponse = await fetch(Theme.routes.cart_add_url, {
        ...config,
        body: JSON.stringify({
          id: Number(mainProductVariantId),
          quantity: mainProductQuantity,
        }),
      });

      if (!mainResponse.ok) {
        const mainError = await mainResponse.text();
        console.error('Granola addon: Failed to add main product', mainError);
        throw new Error(`Failed to add main product: ${mainResponse.status}`);
      }

      console.log('Granola addon: Main product added successfully');

      // Then add the granola
      console.log('Granola addon: Adding granola to cart');
      const response = await fetch(Theme.routes.cart_add_url, {
        ...config,
        body: JSON.stringify({
          id: Number(granolaVariantId),
          quantity: granolaQuantity,
        }),
      });

      console.log('Granola addon: Response status', response.status, response.statusText);

      // Check if granola was added successfully
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Granola addon: Failed to add granola', errorText);

        // Main product was added, but granola failed
        // Still show success but with a warning
        console.warn('Granola addon: Main product added but granola failed');

        // Reload to show cart with main product
        window.location.reload();
        return;
      }

      const data = await response.json();

      console.log('Granola addon: Cart response', data);

      if (data.status && data.status !== 200) {
        throw new Error(data.message || 'Failed to add to cart');
      }

      // Dispatch cart add event for cart drawer/icon update
      const CartAddEvent = new CustomEvent('theme:cart:add', {
        bubbles: true,
        detail: data,
      });
      this.dispatchEvent(CartAddEvent);

      console.log('Granola addon: Successfully added to cart');
    } catch (error) {
      console.error('Granola addon: Error adding to cart:', error);
      alert('Failed to add items to cart. Please try again or add items separately.');
    }
  }
}

if (!customElements.get('granola-addon-component')) {
  customElements.define('granola-addon-component', GranolaAddonComponent);
}
