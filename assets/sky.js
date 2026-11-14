/* The sky over Mumbai. Loaded in <head>, before first paint, so the page
 * arrives already lit the right way. Sunrise and sunset are computed from
 * the date (NOAA's approximation), not looked up anywhere. */
(function () {
  var LAT = 19.076, LON = 72.8777, TZ = 330; // Mumbai; IST is UTC+5:30
  var rad = Math.PI / 180;

  function sun(now) {
    var ist = new Date(now.getTime() + TZ * 60000);           // read with getUTC*
    var start = Date.UTC(ist.getUTCFullYear(), 0, 0);
    var doy = Math.floor((ist.getTime() - start) / 86400000);
    var g = 2 * Math.PI / 365 * (doy - 1);
    var eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
           - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
            - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
            - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(LAT * rad) * Math.cos(dec))
           - Math.tan(LAT * rad) * Math.tan(dec)) / rad;
    var rise = 720 - 4 * (LON + ha) - eq + TZ;                // minutes after IST midnight
    var set  = 720 - 4 * (LON - ha) - eq + TZ;
    var m = ist.getUTCHours() * 60 + ist.getUTCMinutes() + ist.getUTCSeconds() / 60;

    var phase, t;
    if (m >= rise && m <= set) t = (m - rise) / (set - rise);
    else { var night = 1440 - (set - rise); t = ((m > set ? m - set : m + 1440 - set)) / night; }

    if (m >= rise - 40 && m < rise + 50) phase = 'dawn';
    else if (m >= rise + 50 && m < set - 60) phase = 'day';
    else if (m >= set - 60 && m < set + 35) phase = 'dusk';
    else phase = 'night';

    var hh = ist.getUTCHours(), mm = ist.getUTCMinutes();
    return {
      phase: phase, up: m >= rise && m <= set, t: t, rise: rise, set: set,
      clock: (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm
    };
  }

  function apply() {
    var s = sun(new Date()), mode = 'live';
    try { mode = localStorage.getItem('sky') || 'live'; } catch (e) {}
    var el = document.documentElement;
    el.setAttribute('data-phase', mode === 'live' ? s.phase : mode);
    el.setAttribute('data-sky', mode);
    s.mode = mode;
    return s;
  }

  document.documentElement.className += ' js';
  window.SKY = { read: apply, sun: sun };
  apply();
})();
