/* =====================================================
   Cub Scout NFC Scavenger Hunt — Routing Logic
   -------------------------------------------------
   • On the index page, call ScoutHunt.initIndex().
     It reads ?order=3,1,5,2,4 from the URL, saves
     it in localStorage, then shows the first stop.
   • On each station page, call ScoutHunt.initStation(N)
     where N is the station's number (1–5).
     It reads the saved route, shows progress ("Stop 2
     of 5"), and reveals the next-station link or, if
     this is the last stop, a completion celebration.
   ===================================================== */

(function () {
  'use strict';

  var ROUTE_KEY = 'scoutRoute';

  /* Station metadata — update names/emojis to match
     the physical locations you set up.               */
  var STATIONS = {
    '1': { file: 'station01.html', name: 'Trail Station',  emoji: '🌳' },
    '2': { file: 'station02.html', name: 'Shady Shelter',  emoji: '⛺' },
    '3': { file: 'station03.html', name: 'Honor & Colors', emoji: '🚩' },
    '4': { file: 'station04.html', name: 'Creek Crossing', emoji: '🌊' },
    '5': { file: 'station05.html', name: 'The Pavilion',   emoji: '🏕️' },
  };

  /* ── Helpers ──────────────────────────────────── */

  function getRoute() {
    try {
      var raw = localStorage.getItem(ROUTE_KEY);
      if (!raw) return null;
      return raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    } catch (e) {
      console.warn('ScoutHunt: could not read route from localStorage', e);
      return null;
    }
  }

  function saveRoute(orderStr) {
    try {
      localStorage.setItem(ROUTE_KEY, orderStr);
    } catch (e) {
      console.warn('ScoutHunt: could not save route to localStorage', e);
    }
  }

  /* ── Index page ───────────────────────────────── */

  function initIndex() {
    var params = new URLSearchParams(window.location.search);
    var order = params.get('order');
    if (order) saveRoute(order);

    var route = getRoute();
    var startSection = document.getElementById('start-station');
    if (!startSection) return;

    if (route && route.length > 0) {
      var firstId = route[0];
      var station = STATIONS[firstId];
      if (station) {
        startSection.innerHTML =
          '<p style="color:var(--text-body);line-height:1.65;font-size:1rem;margin-bottom:1rem;">' +
            "Your group's first stop is ready!" +
          '</p>' +
          '<div style="text-align:center;">' +
            '<a href="' + station.file + '" class="btn btn-primary">' +
              station.emoji + '&nbsp; Start at ' + station.name + ' &nbsp;\u2192' +
            '</a>' +
          '</div>' +
          '<p style="color:var(--text-muted-card);font-size:0.8rem;text-align:center;margin-top:0.75rem;">' +
            route.length + ' stops in your route' +
          '</p>';
      }
    } else {
      startSection.innerHTML =
        '<p style="color:var(--text-body);line-height:1.65;font-size:1rem;">' +
          'Ask your <strong style="color:#FFC423;">den leader</strong> for your ' +
          "group's starting link, then tap the NFC tag at your first station to begin!" +
        '</p>';
    }
  }

  /* ── Station pages ────────────────────────────── */

  function initStation(stationId) {
    var route = getRoute();
    if (!route) return;

    var id = String(stationId);
    var idx = route.indexOf(id);
    if (idx < 0) return;

    var position = idx + 1;
    var total = route.length;

    /* Update progress badge */
    var progressEl = document.getElementById('station-progress');
    if (progressEl) {
      progressEl.textContent = 'Stop\u00a0' + position + '\u00a0of\u00a0' + total;
    }

    /* Fill the next-station section */
    var nextSection = document.getElementById('next-station-section');
    if (!nextSection) return;

    if (idx === total - 1) {
      /* Last stop — show completion celebration */
      nextSection.innerHTML =
        '<div class="divider" role="presentation"><span class="sparkle">\u2726</span></div>' +
        '<section class="card text-center">' +
          '<div style="font-size:3rem;margin-bottom:0.5rem;">\uD83C\uDFC6</div>' +
          '<h2 class="card-title" style="justify-content:center;">\uD83C\uDF89 Mission Complete!</h2>' +
          '<p style="color:var(--text-body);line-height:1.6;font-size:1rem;margin-bottom:1rem;">' +
            'You and your den have conquered all\u00a0' + total + '\u00a0stations! ' +
            'Report to your <strong style="color:#FFC423;">den leader</strong> to collect your completion patch.' +
          '</p>' +
          '<a href="index.html" class="btn btn-primary">\u2B05 Back to Hunt\u00a0HQ</a>' +
        '</section>';
    } else {
      /* Show the link to the next stop */
      var nextId = route[idx + 1];
      var next = STATIONS[nextId];
      var nextLinkEl = document.getElementById('next-station-link');
      if (next && nextLinkEl) {
        nextLinkEl.href = next.file;
        nextLinkEl.textContent =
          'Head to ' + next.emoji + '\u00a0' + next.name + '\u00a0\u2192';
        nextLinkEl.style.display = 'inline-block';
      }
    }
  }

  /* ── Public API ───────────────────────────────── */
  window.ScoutHunt = {
    initIndex: initIndex,
    initStation: initStation,
  };
}());
