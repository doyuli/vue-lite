import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  stylistic: {
    indent: 2,
    quotes: 'single',
  },
  rules: {
    'no-console': 'off',
    'ts/no-unused-expressions': 'off',
    'ts/no-use-before-define': 'off',
    'ts/explicit-function-return-type': 'off',
    'ts/no-unsafe-function-type': 'off',
    'ts/prefer-literal-enum-member': 'off',
    'import/no-mutable-exports': 'off',
    'prefer-rest-params': 'off',
  },
})
