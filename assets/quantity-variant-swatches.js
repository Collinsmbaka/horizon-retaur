import { Component } from '@theme/component';
import { ThemeEvents, VariantUpdateEvent } from '@theme/events';

/**
 * Quantity Variant Swatches Component
 * Custom quantity selector with image swatches and pricing
 * Syncs with main variant picker
 *
 * @extends {Component}
 */
class QuantityVariantSwatchesComponent extends Component {
  /** @type {Object[]} */
  #variantData = [];

  /** @type {number} */
  #optionPosition = 1;

  connectedCallback() {
    super.connectedCallback();

    // Parse variant data
    const variantDataScript = this.querySelector('[data-variant-data]');
    if (variantDataScript) {
      const data = JSON.parse(variantDataScript.textContent);
      this.#variantData = data.variants || [];
    }

    this.#optionPosition = parseInt(this.dataset.optionPosition) || 1;

    // Hide the standard quantity picker from variant-picker
    this.#hideStandardQuantityPicker();

    // Listen to radio changes
    this.addEventListener('change', this.#handleQuantityChange.bind(this));

    // Listen for variant updates from main variant picker (for Size changes)
    const section = this.closest('.shopify-section');
    if (section) {
      section.addEventListener(ThemeEvents.variantUpdate, this.#handleSizeChange.bind(this));
    }
  }

  /**
   * Hide the standard quantity picker from the main variant picker
   */
  #hideStandardQuantityPicker() {
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

  /**
   * Handle quantity selection
   * @param {Event} event
   */
  #handleQuantityChange(event) {
    const input = event.target;
    if (input.type !== 'radio') return;

    const variantId = input.dataset.variantId;
    const quantity = input.value;

    // Update visual state
    this.#updateSelection(input);

    // Update the main variant picker
    this.#updateMainVariantPicker(variantId, quantity);

    // Dispatch variant update event
    this.#dispatchVariantUpdate(variantId);
  }

  /**
   * Handle size change from main variant picker
   * @param {CustomEvent} event
   */
  #handleSizeChange(event) {
    const { variant } = event.detail;
    if (!variant) return;

    // Find current selected quantity
    const selectedInput = this.querySelector('input[type="radio"]:checked');
    if (!selectedInput) return;

    const currentQuantity = selectedInput.value;

    // Find the variant that matches the new size + current quantity
    const newVariant = this.#variantData.find((v) => {
      // Check if this variant has the current quantity in any option
      return (
        (v.option1 === currentQuantity || v.option2 === currentQuantity || v.option3 === currentQuantity) &&
        (v.option1 === variant.option1 || v.option2 === variant.option2)
      );
    });

    if (newVariant) {
      // Update the variant ID for the selected input
      selectedInput.dataset.variantId = newVariant.id;
    }
  }

  /**
   * Update visual selection state
   * @param {HTMLInputElement} selectedInput
   */
  #updateSelection(selectedInput) {
    // Remove selected class from all labels
    this.querySelectorAll('.quantity-swatch').forEach((label) => {
      label.classList.remove('quantity-swatch--selected');
    });

    // Add selected class to chosen label
    const label = selectedInput.closest('.quantity-swatch');
    if (label) {
      label.classList.add('quantity-swatch--selected');
    }
  }

  /**
   * Update the main variant picker to sync
   * @param {string} variantId
   * @param {string} quantity
   */
  #updateMainVariantPicker(variantId, quantity) {
    const section = this.closest('.shopify-section');
    if (!section) return;

    const mainVariantPicker = section.querySelector('variant-picker');
    if (!mainVariantPicker) return;

    // Find the quantity radio in main picker (if visible)
    const quantityInput = mainVariantPicker.querySelector(`input[value="${quantity}"]`);
    if (quantityInput && quantityInput.name.toLowerCase().includes('quantity')) {
      quantityInput.checked = true;
    }

    // Update the variant ID in the product form
    const productForm = section.querySelector('product-form-component');
    if (productForm) {
      const variantInput = productForm.querySelector('input[name="id"]');
      if (variantInput) {
        variantInput.value = variantId;
      }
    }
  }

  /**
   * Dispatch variant update event
   * @param {string} variantId
   */
  #dispatchVariantUpdate(variantId) {
    const variant = this.#variantData.find((v) => String(v.id) === String(variantId));
    if (!variant) return;

    const section = this.closest('.shopify-section');
    if (section) {
      section.dispatchEvent(
        new VariantUpdateEvent(variant, {
          source: 'quantity-swatch',
          sectionId: section.dataset.sectionId,
        })
      );
    }
  }
}

if (!customElements.get('quantity-variant-swatches-component')) {
  customElements.define('quantity-variant-swatches-component', QuantityVariantSwatchesComponent);
}
