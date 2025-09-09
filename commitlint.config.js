module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'ci',
        'build'
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'api',
        'ios',
        'android',
        'react-native',
        'flutter',
        'docs',
        'examples',
        'sdks',
        'config',
        'deps'
      ]
    ],
    'scope-empty': [0],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-min-length': [2, 'always', 5],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100]
  }
};