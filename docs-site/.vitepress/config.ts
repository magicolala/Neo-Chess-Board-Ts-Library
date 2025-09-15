import { defineConfig } from 'vitepress';

export default defineConfig({
  title: "Neo Chess Board Docs",
  description: "Documentation for Neo Chess Board Library",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'API', link: '/api' },
      { text: 'Examples', link: '/examples' },
      { text: 'Themes', link: '/themes' },
      { text: 'PGN Features', link: '/pgn-features' },
      { text: 'GitHub', link: 'https://github.com/magicolala/Neo-Chess-Board-Ts-Library' }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/' },
          { text: 'Features', link: '/features' }
        ]
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'API Reference', link: '/api' },
          { text: 'PGN Features', link: '/pgn-features' },
          { text: 'Themes', link: '/themes' },
        ]
      },
      {
        text: 'Examples',
        items: [
          { text: 'Basic Usage', link: '/examples' },
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