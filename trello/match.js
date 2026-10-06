/* Card name -> Part Finder job. Pure, DOM-free, node-testable. */
(function (root) {
  var STOP = { the: 1, and: 1, job: 1, room: 1, of: 1 };

  function norm(s) {
    return String(s || "").toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
  }
  function jobNumber(s) {
    var m = /\bj\s*-?\s*(\d{2,6})\b/i.exec(String(s || ""));
    return m ? "J" + m[1] : "";
  }
  function words(s) {
    return norm(s).split(" ").filter(function (w) {
      return w.length > 1 && !STOP[w] && !/^j\d+$/.test(w);
    });
  }
  function overlap(a, b) {
    var seen = {}, n = 0;
    b.forEach(function (w) { seen[w] = 1; });
    a.forEach(function (w) { if (seen[w]) { n++; seen[w] = 0; } });
    return n;
  }

  // Every job that could be this card, best first. A job whose number
  // disagrees with the card's number is never a candidate.
  function rank(cardName, jobs) {
    var num = jobNumber(cardName);
    var cw = words(cardName);
    return (jobs || []).map(function (j) {
      var jn = String(j.number || jobNumber(j.name)).toUpperCase();
      var ov = overlap(cw, words((j.name || "") + " " + (j.room || "")));
      return {
        job: j,
        numHit: !!num && jn === num,
        clash: !!num && !!jn && jn !== num,
        overlap: ov,
        score: (num && jn === num ? 100 : 0) + ov,
      };
    }).filter(function (r) { return !r.clash; })
      .sort(function (a, b) { return b.score - a.score; });
  }

  // { job: <job>|null, candidates: [job...], reason: string }
  // job is only set when the match is unambiguous; otherwise the UI asks.
  function match(cardName, jobs) {
    var r = rank(cardName, jobs);
    var top = r[0], next = r[1];
    var cands = r.filter(function (x) { return x.score > 0; }).map(function (x) { return x.job; });
    if (!top || top.score === 0) return { job: null, candidates: cands, reason: "no-match" };
    if (top.numHit) {
      if (next && next.numHit && next.overlap >= top.overlap)
        return { job: null, candidates: cands, reason: "several-rooms" };
      return { job: top.job, candidates: cands, reason: "number" };
    }
    if (top.overlap >= 2 && (!next || top.overlap > next.overlap))
      return { job: top.job, candidates: cands, reason: "name" };
    return { job: null, candidates: cands, reason: "weak-name" };
  }

  // What a card should show: its pinned job if that still exists, else the match.
  function resolve(cardName, jobs, pinned) {
    var m = match(cardName, jobs);
    var pin = pinned ? (jobs || []).filter(function (j) { return j.key === pinned; })[0] : null;
    return {
      job: pin || m.job,
      pinned: !!pin,
      pinMissing: !!pinned && !pin,
      reason: pin ? "pinned" : m.reason,
      candidates: m.candidates,
    };
  }

  // The one description line this Power-Up owns. Recognised by its link target,
  // so a renamed job or a changed pick replaces it rather than adding another.
  var DESC_MAX = 16384;
  function linkLine(job, viewerBase) {
    var label = ("3D View: " + job.name + (job.room ? " (" + job.room + ")" : "")).replace(/[\[\]]/g, "");
    return "**[" + label + "](" + viewerBase + "?j=" + encodeURIComponent(job.key) + ")**";
  }
  // New description, the same string if nothing needs to change, or null if
  // the result would not fit in a Trello description.
  function withLink(desc, job, viewerBase) {
    desc = desc || "";
    var line = linkLine(job, viewerBase);
    var marker = "](" + viewerBase + "?j=";
    var lines = desc.split("\n");
    var i = -1;
    for (var k = 0; k < lines.length; k++) if (lines[k].indexOf(marker) !== -1) { i = k; break; }
    var out;
    if (i >= 0) { lines[i] = line; out = lines.join("\n"); }
    else out = desc.trim() ? line + "\n\n" + desc : line;
    return out.length > DESC_MAX ? null : out;
  }

  var api = { match: match, resolve: resolve, withLink: withLink, linkLine: linkLine, rank: rank, jobNumber: jobNumber, words: words };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PFMatch = api;
})(this);
