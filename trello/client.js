/* Part Finder 3D – connector. Only file that calls initialize(). */
var ICON = new URL("./icon.svg", window.location.href).href;

function fail(t, what, err) {
  return t.alert({ message: what + ": " + ((err && err.message) || err), duration: 12, display: "error" });
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

TrelloPowerUp.initialize({
  "card-buttons": function (t) {
    return [{ icon: ICON, text: "3D View", callback: openViewer, condition: "always" }];
  },
}, { appName: "Part Finder 3D" });
