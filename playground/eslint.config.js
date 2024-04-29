import eslint from '@antfu/eslint-config'

// Run `npx eslint-flat-config-viewer@latest` to view all rules.
export default eslint({
  rules: {
    'style/brace-style': ['error', '1tbs', {
      allowSingleLine: false,
    }],
    'curly': ['error', 'all'],
    'style/arrow-parens': ['error', 'as-needed', {
      requireForBlockBody: false,
    }],
    'antfu/top-level-function': 'off',
    'style/multiline-ternary': 'off',
    'no-console': 'off',

    /* ======= vue ======= */
    'vue/attribute-hyphenation': ['error', 'never'],
    'vue/v-on-event-hyphenation': ['error', 'never', {
      autofix: true,
    }],
    'vue/max-attributes-per-line': ['error', {
      singleline: 3,
      multiline: 1,
    }],
    'vue/html-closing-bracket-newline': ['error', {
      singleline: 'never',
      multiline: 'never',
    }],
    'vue/first-attribute-linebreak': ['error', {
      singleline: 'beside',
      multiline: 'below',
    }],
    'vue/singleline-html-element-content-newline': 'off',
    'vue/prefer-separate-static-class': 'off',
  },
})
