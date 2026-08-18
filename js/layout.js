// Injects the shared navbar into <div id="site-header" data-active="...">.
// Path depth is derived from this script's own authored src attribute
// (e.g. "js/layout.js" at root vs "../js/layout.js" one level deep),
// since the resolved URL is identical everywhere and can't reveal depth.
(function () {
  var raw = document.currentScript.getAttribute('src') || 'js/layout.js';
  var base = raw.replace(/js\/layout\.js.*$/, '');

  var placeholder = document.getElementById('site-header');
  if (!placeholder) return;
  var active = placeholder.getAttribute('data-active') || '';

  function link(key, href, icon, label) {
    var isActive = active === key;
    return '<a class="nav-link' + (isActive ? ' active' : '') + '"' +
      (isActive ? ' aria-current="page"' : '') +
      ' href="' + base + href + '" aria-label="' + label + '">' +
      '<i class="fa ' + icon + ' nav-icon" aria-hidden="true"></i></a>';
  }

  placeholder.innerHTML =
    '<div class="container">' +
      '<nav class="navbar navbar-expand-lg navbar-light bg-white">' +
        '<a class="navbar-brand" href="http://mdpeg.com/">' +
          '<img src="' + base + 'images/MDP_Engineering_Logo-72dpi.png" alt="MDP Logo" class="navbar-logo" />' +
        '</a>' +
        '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">' +
          '<span class="navbar-toggler-icon"></span>' +
        '</button>' +
        '<div class="collapse navbar-collapse" id="navbarNavAltMarkup">' +
          '<div class="navbar-nav nav-justified w-100 nav-pills rounded-pill">' +
            link('home', 'index.html', 'fa-home', 'Home') +
            link('tables', 'tables/table310-16.html', 'fa-table', 'Ampacity Tables') +
            link('calculators', 'calculators/calculator-start.html', 'fa-calculator', 'Calculators') +
            '<a class="nav-link disabled" href="#" aria-label="Reference" aria-disabled="true"><i class="fa fa-book nav-icon" aria-hidden="true"></i></a>' +
            link('light', 'light/light-start.html', 'fa-lightbulb', 'Lighting') +
            link('power', 'power/power-start.html', 'fa-plug', 'Power') +
          '</div>' +
        '</div>' +
        '<div class="d-flex ms-auto align-items-center">' +
          '<button id="darkModeToggle" type="button" class="btn btn-outline-secondary ms-2" title="Toggle dark mode">🌙</button>' +
        '</div>' +
      '</nav>' +
    '</div>';
})();
