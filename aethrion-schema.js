/**
 * AETHRION — JSON-LD structured data
 * Version: 2026-10-23
 *
 * This file is loaded by the root page after the schema activation workflow
 * adds its script tag to index.html. Keep feature claims aligned with the
 * shipped frontend; do not claim desktop control or full autonomous actions.
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
        description: 'A browser-based AI, developer and creative productivity ecosystem.',
        logo: {
          '@type': 'ImageObject',
          url: siteUrl + 'logo.svg'
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
        description: 'AI conversation, voice interaction, developer resources and creative workspaces.',
        inLanguage: ['tr', 'en'],
        publisher: { '@id': siteUrl + '#organization' }
      },
      {
        '@type': 'WebApplication',
        '@id': siteUrl + '#webapplication',
        name: 'AETHRION',
        alternateName: ['AETHRION AI', 'AETHRION JARVIS'],
        url: siteUrl,
        description: 'A browser-based AI and productivity ecosystem with conversational AI, browser-supported voice input and speech output, task planning, developer tools and creative workspaces.',
        applicationCategory: 'ProductivityApplication',
        applicationSubCategory: 'AI assistant, voice interaction and creative productivity tools',
        operatingSystem: 'Any device with a modern web browser',
        browserRequirements: 'JavaScript enabled; microphone and speech features depend on browser support and user permission. Some features require an account or supported third-party provider.',
        inLanguage: ['tr', 'en'],
        isAccessibleForFree: true,
        publisher: { '@id': siteUrl + '#organization' },
        featureList: [
          'AETHRION AI conversational assistant',
          'AETHRION JARVIS task-assistant mode and task planning',
          'Browser-supported voice input using speech recognition where available',
          'Speech output using browser text-to-speech where available',
          'AI model catalogue and A27 API documentation',
          'AI modes including normal chat, deep-thinking, agent and coding modes where available',
          'Screen reading and screen-related assistant tools where enabled',
          'File analysis and presentation-related workflows where available',
          '3D Studio and creative project tools',
          'Code editor and developer resources',
          'Video tools',
          'Team collaboration interfaces and project workflows',
          'Community features and learning resources',
          'Account and security controls'
        ],
        isRelatedTo: [
          { '@type': 'WebPage', '@id': siteUrl + 'aethrion-assistant.html', name: 'AETHRION AI Assistant' },
          { '@type': 'WebPage', '@id': siteUrl + 'aethrion-jarvis.html', name: 'AETHRION JARVIS Voice Experience' },
          { '@type': 'WebPage', '@id': siteUrl + '3d-studio.html', name: 'AETHRION 3D Studio' },
          { '@type': 'WebPage', '@id': siteUrl + 'api.html', name: 'AETHRION A27 API' }
        ]
      },
      {
        '@type': 'WebPage',
        '@id': siteUrl + 'aethrion-jarvis.html',
        url: siteUrl + 'aethrion-jarvis.html',
        name: 'AETHRION JARVIS — Voice AI and Task Planning',
        description: 'A browser-based voice interaction and task-planning interface. Microphone and speech capabilities depend on browser support and user permission. Desktop control and autonomous external actions are not represented as currently enabled.',
        inLanguage: ['tr', 'en'],
        isPartOf: { '@id': siteUrl + '#website' },
        about: { '@id': siteUrl + '#webapplication' }
      }
    ]
  };

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-aethrion-jsonld', 'true');
  script.textContent = JSON.stringify(graph);
  (document.head || document.documentElement).appendChild(script);
})();
