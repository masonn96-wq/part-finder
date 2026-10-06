// node test/connector.test.js  — runs client.js against a strict fake Trello
var fs = require("fs"), path = require("path"), fail = 0;
function eq(n, g, w) { var ok = g === w; if (!ok) fail++; console.log((ok ? "ok  " : "FAIL") + "  " + n + (ok ? "" : "   got " + g + ", want " + w)); }
var ALLOWED = "id name desc start due dueComplete closed cover attachments members labels checklists url shortLink idList idShort dateLastActivity badges customFieldItems coordinates address locationName pos".split(" ");
function load(withHelpers) {
  var caps, opts, sandbox = { console: { log: function () {}, error: function () {} }, URL: URL, Promise: Promise,
    window: { location: { href: "https://masonn96-wq.github.io/part-finder/trello/index.html" } },
    fetch: function () { return Promise.resolve({ ok: true, json: function () { return { jobs: [
      { key: "j974-cathy-john-bain", name: "J974 - Cathy & John Bain", number: "J974", room: "Kitchen" },
      { key: "j1081-61-howitt-laundry", name: "J1081 - 61 Howitt Laundry", number: "J1081", room: "Laundry" }] }; } }); },
    TrelloPowerUp: { initialize: function (c, o) { caps = c; opts = o; } } };
  sandbox.globalThis = sandbox; sandbox.this = sandbox;
  var vm = require("vm"); vm.createContext(sandbox);
  if (withHelpers) ["keys.js", "match.js"].forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), sandbox); });
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "client.js"), "utf8"), sandbox);
  return { caps: caps, opts: opts };
}
function strictT(name, board) {
  return {
    card: function () { var f = [].slice.call(arguments);
      var bad = f.filter(function (x) { return ALLOWED.indexOf(x) === -1; });
      return bad.length ? Promise.reject(new Error("Invalid field: " + bad.join())) : Promise.resolve({ id: "c1", name: name }); },
    get: function () { return Promise.resolve(null); },
    getContext: function () { return { card: "c1", board: board }; },
    signUrl: function (u) { return u; },
  };
}
(async function () {
  var full = load(true);
  var p = await full.caps["card-back-section"](strictT("J1081 - 61 Howitt Rd - Silcon - Laundry", "5eb1c8032eae4e61556cfacd"));
  eq("3 - Factory Laundry card gets the panel under strict t.card", !!p, true);
  eq("panel carries the board for key choice", p && p.content.url, "./section.html?b=5eb1c8032eae4e61556cfacd");
  p = await full.caps["card-back-section"](strictT("J974 - Cathy & John Bain 10 Morris Rd Upper Beaconsfield - Kitchen", "696ef92c12f1e2d0cae2128f"));
  eq("test board J974 card gets the panel under strict t.card", !!p, true);
  p = await full.caps["card-back-section"](strictT("J1081 - 61 Howitt Rd - Silcon - Powder", "5eb1c8032eae4e61556cfacd"));
  eq("Powder card gets no panel", p, null);
  eq("card button present", full.caps["card-buttons"](strictT("x", "b")).length, 1);
  var bare = load(false);
  p = await bare.caps["card-back-section"](strictT("J1081 - 61 Howitt Rd - Silcon - Laundry", "b"));
  eq("still works if keys.js/match.js didn't load", !!p, true);
  console.log(fail ? fail + " FAILED" : "all passed"); process.exit(fail ? 1 : 0);
})();
