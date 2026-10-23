/**
 * AETHRION — JSON-LD structured data fallback
 * Version: 2026-10-23
 *
 * The homepage contains its primary, crawlable JSON-LD graph inline. This file
 * must not append a second Organization/WebSite graph when that inline graph
 * already exists. It only supplies a fallback for pages that have no AETHRION
 * graph at all.
 */
(function () {
  'use strict';

  if (typeof document === 'undefined') return;

  function hasAethrionGraph() {
    var nodes = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < nodes.length; i++) {
      try {
        var parsed = JSON.parse(nodes[i].textContent || '');
        var graph = Array.isArray(parsed['@graph']) ? parsed['@graph'] : [parsed];
        if (graph.some(function (node) {
          return node && node['@type'] === 'Organization' && node.name === 'AETHRION';
        })) return true;
      } catch (e) {}
    }
    return false;
  }

  if (document.querySelector('script[data-aethrion-jsonld="true"]') || hasAethrionGraph()) return;

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
        logo: { '@type': 'ImageObject', url: siteUrl + 'logo.svg' },
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
        description: 'AI conversation, browser-supported voice interaction, developer resources and creative workspaces.',
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
          'Developer Platform API key management and diagnostics where enabled',
          'Privacy-conscious sanitized security diagnostics where enabled',
          'Community features and learning resources',
          'Account and security controls'
        ]
      },
      {
        '@type': 'WebPage',
        '@id': siteUrl + 'aethrion-jarvis.html',
        url: siteUrl + 'aethrion-jarvis.html',
        name: 'AETHRION JARVIS — Voice AI and Task Planning',
        description: 'A browser-based voice interaction and task-planning interface. Speech features depend on browser support and user permission. This page does not enable desktop control, screen sharing or autonomous external actions.',
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
