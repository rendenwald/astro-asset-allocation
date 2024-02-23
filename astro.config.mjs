import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, squooshImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import compress from 'astro-compress';
import tasks from './src/utils/tasks';
import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin } from './src/utils/frontmatter.mjs';
import { ANALYTICS, SITE } from './src/utils/config.ts';
import react from "@astrojs/react";
import jopSoftwarecookieconsent from "@jop-software/astro-cookieconsent";
import { COOKIECONSENTCONFIG } from "./src/env.d.ts";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const whenExternalScripts = (items = []) => ANALYTICS.vendors.googleAnalytics.id && ANALYTICS.vendors.googleAnalytics.partytown ? Array.isArray(items) ? items.map(item => item()) : [items()] : [];

function loadGoogleAnalytics() {
  const g = document.createElement('script')
  g.onload = function () {
    window.dataLayer = window.dataLayer || []
    function gtag() {
      // dataLayer.push(arguments)
    }
    gtag('js', new Date())

    gtag('config', 'G-02L3K7YXXK')
  }
  g.src = 'https://www.googletagmanager.com/gtag/js?id=G-02L3K7YXXK'

  document.head.appendChild(g)
}

function loadNecessary() {}

// https://astro.build/config
export default defineConfig({
  site: SITE.site,
  base: SITE.base,
  trailingSlash: SITE.trailingSlash ? 'always' : 'never',
  output: 'static',
  integrations: [tailwind({
    applyBaseStyles: false
  }), sitemap(), mdx(), icon({
    include: {
      tabler: ['*'],
      'flat-color-icons': ['like', 'engineering', 'pie-chart', 'template', 'gallery', 'approval', 'document', 'advertising', 'currency-exchange', 'voice-presentation', 'business-contact', 'database']
    }
  }), ...whenExternalScripts(() => partytown({
    config: {
      forward: ['dataLayer.push']
    }
  })), compress({
    CSS: true,
    HTML: {
      'html-minifier-terser': {
        removeAttributeQuotes: false
      }
    },
    Image: false,
    JavaScript: true,
    SVG: false,
    Logger: 1
  }), tasks(), react(), jopSoftwarecookieconsent({
    guiOptions: {
      consentModal: {
        layout: 'box wide',
        position: 'middle center',
        equalWeightButtons: true,
        flipButtons: false,
      },
      preferencesModal: {
        layout: 'box',
        position: 'right',
        equalWeightButtons: true,
        flipButtons: false,
      },
    },
    categories: {
        necessary: {
            enabled: true,  // this category is enabled by default
            readOnly: true  // this category cannot be disabled
        },
        analytics: {}
    },language: {
      default: 'en',
      autoDetect: 'browser',
      translations: {
        en: {
          consentModal: {
            title: 'Privacy settings',
            description:
              `Our website uses essential cookies and external services to ensure its proper operation and tracking cookies to understand how you interact with it.
              The latter will be set only after consent.
              We also use embedded content like videos and presentations which are hosted on third-party-providers.`,
            closeIconLabel: '',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            showPreferencesBtn: 'Manage preferences',
            footer: '<a href="/privacy.html">Privacy Policy</a>\n',
          },
          preferencesModal: {
            title: 'Consent Preferences Center',
            closeIconLabel: 'Close modal',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            savePreferencesBtn: 'Save preferences',
            serviceCounterLabel: 'Service|Services',
            sections: [
              {
                title: 'Strictly Necessary Cookies <span class="pm__badge">Always Enabled</span>',
                description:
                  'We also use cookies to remember you privacy and settings. These cookies do only contain technical, but no personal information.',
                linkedCategory: 'necessary',
                cookieTable: {
                  headers: {
                    name: 'Cookie',
                    domain: 'Domain',
                    desc: 'Description',
                  },
                  body: [
                    {
                      name: 'cc_cookie',
                      domain: 'purista.dev',
                      desc: 'Remembers your privacy decessions',
                    },
                  ],
                },
              },
              {
                title: 'Analytics Cookies',
                description:
                  'We would like to know how successful our website is. Therefore, we use Google Analytics to find out, for example, the number of monthly visitors to our website.',
                linkedCategory: 'analytics',
                cookieTable: {
                  headers: {
                    name: 'Cookie',
                    domain: 'Domain',
                    desc: 'Description',
                  },
                  body: [
                    {
                      name: '_ga',
                      domain: 'purista.dev',
                      desc: 'The main cookie used by Google Analytics, enables the service to distinguish one visitor from another and lasts for 2 years',
                    },
                    {
                      name: '_gid',
                      domain: 'purista.dev',
                      desc: 'A unique ID that is used to generate statistical data on how the visitor uses the website. This cookie expires after 1 day. collect: is used to send data to Google Analytics about the visitors device and behavior.',
                    },
                  ],
                },
              },
            ],
          },
        },
      }
    },
    onConsent: function (e) {
      if (e.cookie.categories.includes('necessary')) {
        loadNecessary()
      }

      if (e.cookie.categories.includes('analytics')) {
        loadGoogleAnalytics()
      }
    },
})
],
  image: {
    service: squooshImageService()
  },
  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin],
    rehypePlugins: [responsiveTablesRehypePlugin]
  },
  vite: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src')
      }
    }
  }
});