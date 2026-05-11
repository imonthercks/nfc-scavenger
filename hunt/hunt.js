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

  var STATION_DATA = null;

  function fetchStationData() {
    if (STATION_DATA) return Promise.resolve(STATION_DATA);
    return fetch('stations.json').then(function (r) {
      if (!r.ok) throw new Error('Could not load stations.json');
      return r.json();
    }).then(function (data) {
      STATION_DATA = data || {};
      return STATION_DATA;
    }).catch(function (err) {
      console.warn('ScoutHunt: could not fetch station data', err);
      STATION_DATA = {};
      return STATION_DATA;
    });
  }

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
    var rawOrder = params.get('order');
    if (rawOrder) {
      // support base64-encoded order strings to make the route less readable
      var decoded = null;
      try {
        // try base64 decode first
        decoded = (function (s) {
          try { return decodeURIComponent(atob(s)); } catch (e) { return null; }
        })(rawOrder);
      } catch (e) {
        decoded = null;
      }
      // fallback to raw value if decode failed
      var orderToSave = decoded || rawOrder;
      saveRoute(orderToSave);
    }

    var route = getRoute();
    var startSection = document.getElementById('start-station');
    if (!startSection) return;

    if (!route || route.length === 0) {
      startSection.innerHTML =
        '<p style="color:var(--text-body);line-height:1.65;font-size:1rem;">' +
          'Ask your <strong style="color:#FFC423;">den leader</strong> for your ' +
          "group's starting link, then tap the NFC tag at your first station to begin!" +
        '</p>';
      return;
    }

    var firstId = route[0];
    // Ensure station data is loaded before rendering clue preview
    fetchStationData().then(function () {
      var meta = STATION_DATA[firstId] || STATIONS[firstId] || null;
      var clue = meta && meta.clue ? meta.clue : null;

      // Remove the explicit start link so the first destination isn't revealed.
      // Instead show a prominent, map-like clue card.
      var html = '<p style="color:var(--text-body);line-height:1.65;font-size:1rem;margin-bottom:1rem;">' +
          "Your den is ready — good luck, Scouts!" +
        '</p>' +
        '<div style="text-align:center;">' +
          '<div class="clue-box clue-map">' +
            '<div class="clue-text">' + (clue || 'Your first clue will appear here when the hunt starts.') + '</div>' +
            (meta && meta.clueHint ? '<div style="margin-top:0.6rem;color:var(--text-muted-card);font-size:0.9rem;">' + meta.clueHint + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<p style="color:var(--text-muted-card);font-size:0.8rem;text-align:center;margin-top:0.75rem;">' +
          route.length + ' stops in your route' +
        '</p>';

      startSection.innerHTML = html;
    });
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

    function renderWithData() {
      var data = STATION_DATA && STATION_DATA[id] ? STATION_DATA[id] : null;

      // If this is the last station in the saved route, clear the saved route
      // so the hunt can be restarted, then navigate to the completion page.
      if (idx === total - 1) {
        try {
          localStorage.removeItem(ROUTE_KEY);
        } catch (e) {
          /* ignore storage failures */
        }
        try {
          window.location.replace('completion.html');
        } catch (e) {
          window.location.href = 'completion.html';
        }
        return;
      }

      var progressEl = document.getElementById('station-progress');
      if (progressEl) {
        progressEl.textContent = 'Stop\u00a0' + position + '\u00a0of\u00a0' + total;
      }

      var titleEl = document.getElementById('station-title');
      var emojiEl = document.getElementById('station-emoji');
      if (titleEl) titleEl.textContent = (data && data.name) || (STATIONS[id] && STATIONS[id].name) || 'Station';
      if (emojiEl) emojiEl.textContent = (data && data.emoji) || (STATIONS[id] && STATIONS[id].emoji) || '';

      var clueBox = document.getElementById('clue-box');
      var clueHint = document.getElementById('clue-hint');
      var activityBox = document.getElementById('activity-box');
      // Show the clue for the *next* station in the route (so after scanning this tag,
      // scouts see the clue that leads them to the following stop).
      function setClueText(container, text) {
        if (!container) return;
        var textEl = container.querySelector && container.querySelector('.clue-text');
        if (textEl) textEl.textContent = text || '';
        else container.innerHTML = text || '';
      }

      if (idx === total - 1) {
        setClueText(clueBox, (data && data.clue) || '');
        if (clueHint) clueHint.textContent = data && data.clueHint ? data.clueHint : '';
      } else {
        var nextIdForClue = route[idx + 1];
        var nextStationData = STATION_DATA && STATION_DATA[nextIdForClue] ? STATION_DATA[nextIdForClue] : (STATIONS[nextIdForClue] || {});
        setClueText(clueBox, nextStationData.clue || '');
        if (clueHint) clueHint.textContent = nextStationData.clueHint || '';
      }

      if (activityBox) activityBox.textContent = data && data.activity ? data.activity : '';

      var nextHintEl = document.getElementById('next-hint');
      var nextLinkEl = document.getElementById('next-station-link');
      var nextSection = document.getElementById('next-station-section');
      if (!nextSection) return;

      if (idx === total - 1) {
        nextSection.innerHTML =
          '<div class="divider" role="presentation"><span class="sparkle">\u2726</span></div>' +
          '<section class="card text-center">' +
            '<div style="font-size:3rem;margin-bottom:0.5rem;">\uD83C\uDFC6</div>' +
            '<h2 class="card-title" style="justify-content:center;">\uD83C\uDF89 Mission Complete!</h2>' +
            '<p style="color:var(--text-body);line-height:1.6;font-size:1rem;margin-bottom:1rem;">' +
              'You and your den have conquered all\u00a0' + total + '\u00a0stations! ' +
              'Report to your <strong style="color:#FFC423;">den leader</strong> to collect your completion patch.' +
            '</p>' +
            '<a href="completion.html" class="btn btn-primary">\u2B05 Back to Hunt\u00a0HQ</a>' +
          '</section>';
      } else {
        var nextId = route[idx + 1];
        var nextMeta = STATION_DATA && STATION_DATA[nextId] ? STATION_DATA[nextId] : (STATIONS[nextId] || {});
        if (nextHintEl) nextHintEl.textContent = nextMeta.nextHint || '';
        if (nextLinkEl) {
          nextLinkEl.href = 'station.html?id=' + encodeURIComponent(nextId);
          nextLinkEl.textContent = 'Head to ' + (nextMeta.emoji || '') + '\u00a0' + (nextMeta.name || '') + '\u00a0\u2192';
          nextLinkEl.style.display = 'inline-block';
        }
      }
    }

    if (STATION_DATA) {
      renderWithData();
    } else {
      fetchStationData().then(function () {
        renderWithData();
      });
    }
  }

  /* ── Public API ───────────────────────────────── */
  window.ScoutHunt = {
    initIndex: initIndex,
    initStation: initStation,
  };

  if (window._pendingStationId) {
    try {
      window.ScoutHunt.initStation(window._pendingStationId);
      window._pendingStationId = null;
    } catch (e) {
      /* ignore */
    }
  }
}());
