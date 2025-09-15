import { defineConfig } from 'vitepress';

export default defineConfig({
  base: '/Neo-Chess-Board-Ts-Library/docs/',
  title: "Neo Chess Board Docs",
  description: "Documentation for Neo Chess Board Library",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/Neo-Chess-Board-Ts-Library/docs/' },
      { text: 'API', link: '/Neo-Chess-Board-Ts-Library/api.md' },
      { text: 'Examples', link: '/Neo-Chess-Board-Ts-Library/examples.md' },
      { text: 'Themes', link: '/Neo-Chess-Board-Ts-Library/themes.md' },
      { text: 'PGN Features', link: '/Neo-Chess-Board-Ts-Library/pgn-features.md' },
      { text: 'GitHub', link: 'https://github.com/magicolala/Neo-Chess-Board-Ts-Library' }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/Neo-Chess-Board-Ts-Library/docs/' },
          { text: 'Features', link: '/Neo-Chess-Board-Ts-Library/docs/features.md' }
        ]
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'API Reference', link: '/Neo-Chess-Board-Ts-Library/api.md' },
          { text: 'PGN Features', link: '/Neo-Chess-Board-Ts-Library/pgn-features.md' },
          { text: 'Themes', link: '/Neo-Chess-Board-Ts-Library/themes.md' },
        ]
      },
      {
        text: 'Examples',
        items: [
          { text: 'Basic Usage', link: '/Neo-Chess-Board-Ts-Library/examples.md' },
          // More specific examples can be added here later
        ]
      }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present Cédric Oloa'
    }
  }
});