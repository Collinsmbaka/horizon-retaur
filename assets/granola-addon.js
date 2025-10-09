import { Component } from '@theme/component';
import { fetchConfig } from '@theme/utilities';
import { CartAddEvent } from '@theme/events';

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

    // Prevent the default form submission so we can handle it ourselves
    event.preventDefault();
    event.stopPropagation();

    console.log('Granola addon: Preventing default, will add both items');

    try {
      // Get form data
      const form = event.target;
      const formData = new FormData(form);
      const mainProductVariantId = formData.get('id');
      const mainProductQuantity = parseInt(formData.get('quantity')) || 1;
      const granolaQuantity = parseInt(this.refs.granolaInput.value) || 1;

      // Parse variant ID and convert to number
      const granolaVariantIdString = String(this.dataset.granolaVariantId || '').trim().split(/\s+/)[0];
      const granolaVariantId = parseInt(granolaVariantIdString, 10);

      console.log('Granola addon: Adding both items', {
        mainProductVariantId,
        mainProductQuantity,
        granolaVariantId,
        granolaQuantity,
      });

      // Add main product first
      const mainFormData = new FormData();
      mainFormData.append('id', mainProductVariantId);
      mainFormData.append('quantity', mainProductQuantity);

      const mainResponse = await fetch('/cart/add.js', {
        method: 'POST',
        body: mainFormData,
      });

      if (!mainResponse.ok) {
        throw new Error('Failed to add main product');
      }

      console.log('Granola addon: Main product added');

      // Add granola
      const granolaFormData = new FormData();
      granolaFormData.append('id', granolaVariantId);
      granolaFormData.append('quantity', granolaQuantity);

      const granolaResponse = await fetch('/cart/add.js', {
        method: 'POST',
        body: granolaFormData,
      });

      if (!granolaResponse.ok) {
        console.warn('Granola addon: Failed to add granola, but main product was added');
      } else {
        console.log('Granola addon: Granola added successfully');
      }

      // Fetch the updated cart to get the latest data
      const cartResponse = await fetch('/cart.js');
      const cartData = await cartResponse.json();

      console.log('Granola addon: Fetched updated cart', cartData);

      // Dispatch the proper CartAddEvent that the theme listens to
      const section = this.closest('.shopify-section');
      const cartAddEvent = new CartAddEvent(cartData, section?.dataset?.sectionId, {
        source: 'granola-addon',
        itemCount: cartData.item_count,
      });

      document.dispatchEvent(cartAddEvent);
      console.log('Granola addon: Dispatched CartAddEvent');

    } catch (error) {
      console.error('Granola addon: Error adding to cart:', error);
      // If there's an error, fall back to normal form submission
      event.target.submit();
    }
  }
}

if (!customElements.get('granola-addon-component')) {
  customElements.define('granola-addon-component', GranolaAddonComponent);
}
