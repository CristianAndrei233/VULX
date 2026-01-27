import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'VULX',
  description: 'API Security Scanner Documentation',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'CLI', link: '/cli/getting-started' },
      { text: 'CI/CD', link: '/cicd/overview' },
      { text: 'API', link: '/api/reference' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Core Concepts', link: '/guide/core-concepts' }
          ]
        },
        {
          text: 'Features',
          items: [
            { text: 'Vulnerability Detection', link: '/guide/vulnerability-detection' },
            { text: 'OpenAPI Parsing', link: '/guide/openapi-parsing' },
            { text: 'Reporting', link: '/guide/reporting' }
          ]
        }
      ],
      '/cli/': [
        {
          text: 'CLI Reference',
          items: [
            { text: 'Getting Started', link: '/cli/getting-started' },
            { text: 'Commands', link: '/cli/commands' },
            { text: 'Configuration', link: '/cli/configuration' }
          ]
        }
      ],
      '/cicd/': [
        {
          text: 'CI/CD Integration',
          items: [
            { text: 'Overview', link: '/cicd/overview' },
            { text: 'GitHub Actions', link: '/cicd/github-actions' },
            { text: 'GitLab CI', link: '/cicd/gitlab-ci' },
            { text: 'Jenkins', link: '/cicd/jenkins' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/reference' },
            { text: 'Authentication', link: '/api/authentication' },
            { text: 'Endpoints', link: '/api/endpoints' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-org/vulx' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 VULX'
    },

    search: {
      provider: 'local'
    }
  }
})
