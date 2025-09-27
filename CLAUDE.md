# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Horizon** is Shopify's flagship next-generation theme (v2.1.6) that represents the cutting edge of Shopify's theme development standards. This is a **Shopify Liquid theme** built for modern e-commerce storefronts using server-rendered HTML with Shopify's Liquid templating engine.

## Key Architecture Principles

- **Web-native approach**: Leverages evergreen web browsers with progressive enhancement
- **Zero external dependencies**: Uses native browser APIs exclusively
- **Server-rendered**: Business logic stays on Shopify servers using Liquid
- **Functional over pixel-perfect**: Maintains functionality across all browsers
- **Component-based**: Uses Shopify's advanced theme blocks architecture

## Development Commands

**Primary Development Tool:**
```bash
shopify theme dev
```

**Linting and Validation:**
```bash
shopify theme check
```

**Pull Latest Changes:**
```bash
git fetch upstream
git pull upstream main
```

## Project Structure

```
/assets/          - CSS, JavaScript, and static assets
/blocks/          - Reusable theme blocks (89+ files)
/config/          - Theme configuration (settings_schema.json, settings_data.json)
/layout/          - Base layout templates (theme.liquid, password.liquid)
/locales/         - Multi-language translation files (50+ languages)
/sections/        - Main content sections (35+ files)
/snippets/        - Reusable code snippets (112+ files)
/templates/       - Page templates in JSON format (15+ files)
```

## Technology Stack

- **Liquid templating engine** - Server-side templating
- **Vanilla JavaScript** - Zero external dependencies policy
- **Modern CSS** - CSS custom properties, container queries, logical properties
- **Component framework** - Custom JavaScript framework (`assets/component.js`)
- **Theme blocks** - Schema-driven configurable components

## Development Standards

The project includes comprehensive development standards in `.cursor/rules/`:

### CSS Standards (`css-standards.mdc`)
- Single class specificity (0 1 0) preferred
- No IDs as selectors, avoid `!important`
- BEM naming convention
- CSS custom properties for theming
- Logical properties for RTL support
- Container queries for responsive design

### JavaScript Standards (`javascript-standards.mdc`)
- Zero external dependencies - use native browser APIs
- Async/await over promises
- Use `for...of` over `forEach`
- Component framework for interactive elements
- Event-driven architecture for component communication
- Comprehensive JSDoc type annotations

### Liquid Standards (`liquid.mdc`)
- Use `{% liquid %}` tags for multi-line logic
- Proper variable assignment and template inclusion
- Schema-driven component configuration

### Accessibility Standards
- Comprehensive WCAG compliance built into every component
- Screen reader optimization
- Keyboard navigation support
- Color contrast requirements

## Component Framework

Horizon uses a custom JavaScript component framework (`assets/component.js`) that provides:
- Lifecycle management for JavaScript components
- Ref-based DOM element access
- Event handling patterns
- Type-safe component communication

Example component structure:
```javascript
import { Component } from '@theme/component';

/**
 * @typedef {Object} MyComponentRefs
 * @property {HTMLElement} targetElement - Description
 */

/**
 * @extends {Component<MyComponentRefs>}
 */
class MyComponent extends Component {
  connectedCallback() {
    super.connectedCallback();
    // Component initialization
  }

  handleEvent(event) {
    // Event handling with ref access
    this.refs.targetElement.textContent = 'Updated';
  }
}

customElements.define('my-component', MyComponent);
```

## Theme Blocks System

Horizon uses Shopify's advanced theme blocks:
- **Static blocks**: Pre-defined by theme developers
- **Dynamic blocks**: Configurable by merchants in theme editor
- **Nested blocks**: Blocks can contain other blocks
- **Schema-driven**: All blocks use JSON schema for configuration

## CSS Architecture

- **Scoped variables**: Use CSS custom properties with component namespacing
- **Design tokens**: Consistent spacing and typography scales
- **Color schemes**: Semantic color variables with dark mode support
- **Performance**: CSS containment, efficient animations using transform/opacity

## Performance Optimization

- **Critical CSS**: Inline critical styles for fast loading
- **Lazy loading**: Images and components load on demand
- **View transitions**: Smooth page navigation
- **Progressive enhancement**: Core functionality works without JavaScript

## Internationalization

- **50+ languages**: Complete localization support
- **RTL support**: Built-in right-to-left language support
- **Schema translations**: Theme editor translated for all languages

## Quality Assurance

- **GitHub Actions**: Automated CI/CD pipeline
- **Theme Check**: Runs on every commit
- **Accessibility testing**: Integrated into CI pipeline
- **Breaking change detection**: Automated workflow

## Development Workflow

1. Use Shopify CLI for local development (`shopify theme dev`)
2. Follow Theme Check recommendations (`shopify theme check`)
3. Test across multiple browsers and devices
4. Validate accessibility with built-in tools
5. Never use external dependencies - leverage native browser APIs
6. Follow BEM CSS naming and component patterns
7. Use the custom component framework for JavaScript interactions

## Key Files to Understand

- `/layout/theme.liquid` - Main theme structure and global includes
- `/assets/base.css` - Core styling (4,000+ lines)
- `/assets/component.js` - JavaScript component framework
- `/config/settings_schema.json` - Theme customization schema
- `/sections/` - Primary page sections with JSON configurations
- `/blocks/` - Reusable theme blocks for section content

## Important Notes

- This codebase prioritizes functionality and performance over pixel-perfect design
- All JavaScript should be written using the custom component framework
- CSS should follow the established design token system
- Theme blocks should be schema-driven and highly configurable
- Accessibility is not optional - it's built into every component
- Progressive enhancement ensures functionality across all browsers