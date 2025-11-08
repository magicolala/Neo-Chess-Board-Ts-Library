/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
  entryPointStrategy: 'expand',
  entryPoints: ['src/index.ts', 'src/react/index.ts'],
  tsconfig: 'tsconfig.json',
  plugin: ['typedoc-plugin-markdown'],
  out: 'mkdocs_docs/reference',
  readme: 'none',
  cleanOutputDir: true,
  categorizeByGroup: false,
  githubPages: false,
  includeVersion: true,
  disableSources: true
};
