module.exports = {
  default: {
    paths: ['tests/features/**/*.feature'],
    require: [
      'tests/support/world.ts',
      'tests/support/hooks.ts',
      'tests/steps/**/*.ts',
    ],
    requireModule: ['tsx'],
    format: [
      'progress-bar',
      'html:reports/cucumber-report.html',
    ],
    formatOptions: { snippetInterface: 'async-await' },
  },
};
