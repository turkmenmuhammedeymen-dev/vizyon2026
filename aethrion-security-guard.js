/* AETHRION auth overlay stacking fix — keep authentication UI above dashboard stacking contexts. */
(function () {
  'use strict';
  var overlayIds = ['authModal', 'socialAuthTermsModal', 'profileCompletionModal', 'recoveryLoginModal'];
  function liftAuthOverlays() {
    overlayIds.forEach(function (id) {
      var node = document.getElementById(id);
      if (node && node.parentElement !== document.body) {
        document.body.appendChild(node);
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', liftAuthOverlays, { once: true });
  } else {
    liftAuthOverlays();
  }
  // Some account flows create/recreate overlays after initial page parsing.
  if (typeof MutationObserver !== 'undefined' && document.documentElement) {
    var observer = new MutationObserver(function () { liftAuthOverlays(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
