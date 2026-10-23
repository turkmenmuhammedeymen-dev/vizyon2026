/**
 * AETHRION — JSON-LD structured data
 * Version: 2026-10
 *
 * IMPORTANT:
 * Include this file in the <head> of index.html:
 * <script src="/aethrion-schema.js" defer></script>
 *
 * Keep the canonical URL and public profile URLs accurate. This file deliberately
 * describes only product areas documented in the repository; it does not claim
 * that planned JARVIS, desktop-control, or advanced agent features are already live.
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;
  if (document.querySelector('script[data-aethrion-jsonld="true"]')) return;

  var siteUrl = 'https://vizyon2026.vercel.app/';
  var graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': siteUrl + '#organization',
        name: 'AETHRION',
        url: siteUrl,
        description: 'A browser-based AI and productivity ecosystem.',
        logo: {
          '@type': 'ImageObject',
          url: siteUrl + 'logo.svg',
          width: 1200,
          height: 360
        },
        sameAs: [
          'https://www.instagram.com/aethrion.official/',
          'https://whatsapp.com/channel/0029VbCpnvuG8l5FQVQMLy1U'
        ]
      },
      {
        '@type': 'WebSite',
        '@id': siteUrl + '#website',
        url: siteUrl,
        name: 'AETHRION',
        alternateName: 'AETHRION — Intelligence Without Limits',
        description: 'AI tools, productivity features, developer resources and creative workspaces.',
        inLanguage: ['tr', 'en'],
        publisher: { '@id': siteUrl + '#organization' }
      },
      {
        '@type': 'WebApplication',
        '@id': siteUrl + '#webapplication',
        name: 'AETHRION',
        alternateName: 'AETHRION AI',
        url: siteUrl,
        description: 'A browser-based ecosystem bringing AI conversation, developer resources and creative productivity tools together.',
        applicationCategory: 'ProductivityApplication',
        applicationSubCategory: 'AI assistant and creative productivity tools',
        operatingSystem: 'Any device with a modern web browser',
        browserRequirements: 'JavaScript enabled; some features require an account or supported third-party provider.',
        inLanguage: ['tr', 'en'],
        isAccessibleForFree: true,
        publisher: { '@id': siteUrl + '#organization' },
        featureList: [
          'AI conversation interface',
          'AI model catalogue and API documentation',
          '3D Studio',
          'Code editor',
          'Video tools',
          'Community and projects',
          'Account and security controls',
          'Learning resources',
          'Team collaboration interfaces'
        ]
      }
    ]
  };

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-aethrion-jsonld', 'true');
  script.textContent = JSON.stringify(graph);
  (document.head || document.documentElement).appendChild(script);
})();
