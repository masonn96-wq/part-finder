/* Part Finder 3D – connector. Only file that calls initialize(). */
var ICON = new URL("./icon.svg", window.location.href).href;          // white: card buttons
var ICON_DARK = new URL("./icon-dark.svg", window.location.href).href; // grey: card-back heading
var INDEX = new URL("../jobs/index.json", window.location.href);
// Never depend on load order: a cached index.html may not load keys.js / match.js.
try { console.log("[PF3D] connector v5", "keys:" + (typeof PFKeys), "match:" + (typeof PFMatch)); } catch (e) {}

function fail(t, what, err) {
  return t.alert({ message: what + ": " + ((err && err.message) || err), duration: 12, display: "error" });
}

// One fetch per minute, shared by every card on the board.
var jobsCache = null, jobsAt = 0;
function getJobs() {
  if (jobsCache && Date.now() - jobsAt < 60000) return jobsCache;
  var u = new URL(INDEX); u.searchParams.set("t", Math.floor(Date.now() / 60000));
  jobsAt = Date.now();
  jobsCache = fetch(u.href).then(function (r) {
    if (!r.ok) throw new Error("jobs/index.json answered " + r.status);
    return r.json();
  }).then(function (d) { return (d && d.jobs) || []; })
    .catch(function (e) { jobsCache = null; throw e; });
  return jobsCache;
}

function openViewer(t) {
  var ctx = {};
  try { ctx = t.getContext() || {}; } catch (e) { ctx = {}; }

  return Promise.all([
    t.card("id", "name").catch(function () { return null; }),
    t.get("card", "shared", "pfJob").catch(function () { return null; }),
  ]).then(function (r) {
    var card = r[0] || {};
    var cardId = card.id || ctx.card || "";
    if (!cardId) return t.alert({ message: "Couldn't identify the card.", display: "error" });
    return t.modal({
      url: "./viewer.html",
      args: { cardId: cardId, cardName: card.name || "", pinned: r[1] || "" },
      fullscreen: true,
      title: "3D View",
    });
  }).catch(function (err) { return fail(t, "Couldn't open the 3D view", err); });
}

// Panel under the description. Only on cards that have a job, so the rest of
// the board stays clean; the card button still lets you pick one by hand.
function cardBackSection(t) {
  return Promise.all([
    t.card("name").catch(function () { return null; }),   // only documented fields: idBoard is NOT one
    t.get("card", "shared", "pfJob").catch(function () { return null; }),
    getJobs().catch(function () { return null; }),
  ]).then(function (r) {
    var name = (r[0] && r[0].name) || "";
    var ctx = {}; try { ctx = t.getContext() || {}; } catch (e) {}
    var board = ctx.board || "";
    var jobs = r[2];
    if (jobs && typeof PFMatch !== "undefined") {
      var res = PFMatch.resolve(name, jobs, r[1] || "");
      if (!res.job) return null;
    }
    // jobs failed to load: still show the panel, it reports the error itself.
    return {
      title: "3D View",
      icon: ICON_DARK,
      content: { type: "iframe", url: t.signUrl("./section.html?b=" + encodeURIComponent(board), { cardName: name }), height: 500 },
    };
  }).catch(function (e) { try { console.error("[PF3D] card-back-section", e); } catch (x) {} return null; });
}

TrelloPowerUp.initialize({
  "card-buttons": function (t) {
    return [{ icon: ICON, text: "3D View", callback: openViewer, condition: "always" }];
  },
  "card-back-section": cardBackSection,
}, { appName: "Part Finder 3D" }); // as in the version proven on Trello: the connector makes no REST calls
