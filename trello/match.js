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

  var api = { match: match, rank: rank, jobNumber: jobNumber, words: words };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PFMatch = api;
})(this);
