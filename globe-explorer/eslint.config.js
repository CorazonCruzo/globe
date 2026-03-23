import {tanstackConfig} from '@tanstack/eslint-config';

export default [
  {ignores: ['dist', 'eslint.config.js']},
  ...tanstackConfig.map((config) => {
    if (config.languageOptions?.parserOptions?.project) {
      return {
        ...config,
        languageOptions: {
          ...config.languageOptions,
          parserOptions: {
            ...config.languageOptions.parserOptions,
            project: undefined,
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
          },
        },
      };
    }
    return config;
  }),
];
