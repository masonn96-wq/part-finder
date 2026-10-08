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

  // Room part of a card name: everything after "J#### - <client/address> -".
  // "J1081 - 61 Howitt Rd - Silcon - Powder" -> "Silcon - Powder". Empty when the
  // card is one-per-job ("J974 - Cathy & John Bain 10 Morris Rd").
  function roomWords(cardName) {
    var segs = String(cardName || "").split(/\s+-\s+/);
    return segs.length > 2 ? words(segs.slice(2).join(" ")) : [];
  }

  // Every job that could be this card, best first. Never a candidate:
  // - a job whose number disagrees with the card's number;
  // - a same-number job for a different room (the card names a room and it
  //   shares no word with the job's room), so a Powder card never gets the
  //   Laundry model just because they are both J1081.
  function rank(cardName, jobs) {
    var num = jobNumber(cardName);
    var cw = words(cardName);
    var cr = roomWords(cardName);
    return (jobs || []).map(function (j) {
      var jn = String(j.number || jobNumber(j.name)).toUpperCase();
      var ov = overlap(cw, words((j.name || "") + " " + (j.room || "")));
      var otherRoom = !!num && jn === num && !!j.room && cr.length > 0 && overlap(cr, words(j.room)) === 0;
      return {
        job: j,
        numHit: !!num && jn === num,
        clash: (!!num && !!jn && jn !== num) || otherRoom,
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

  // Every model this card covers. One card can cover several rooms of a job
  // ("Bed 1+4 Robes" = Bed 1 Robe + Bed 4 Robe): when same-number jobs tie,
  // the card gets all of them rather than none.
  function matchAll(cardName, jobs) {
    var m = match(cardName, jobs);
    if (m.job) return [m.job];
    if (m.reason !== "several-rooms") return [];
    var r = rank(cardName, jobs).filter(function (x) { return x.numHit; });
    var best = r.length ? r[0].overlap : 0;
    return r.filter(function (x) { return x.overlap === best; }).map(function (x) { return x.job; });
  }

  // What a card should show: its pinned job if that still exists, else the match(es).
  function resolve(cardName, jobs, pinned) {
    var m = match(cardName, jobs);
    var pin = pinned ? (jobs || []).filter(function (j) { return j.key === pinned; })[0] : null;
    var all = pin ? [pin] : matchAll(cardName, jobs);
    return {
      jobs: all,
      job: all[0] || null,
      pinned: !!pin,
      pinMissing: !!pinned && !pin,
      reason: pin ? "pinned" : (all.length > 1 ? "rooms" : m.reason),
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
  // the result would not fit in a Trello description. Our link lines (one per
  // job) replace whatever link lines were there, in the same place.
  function withLinks(desc, jobs, viewerBase) {
    desc = desc || "";
    var block = jobs.map(function (j) { return linkLine(j, viewerBase); });
    var marker = "](" + viewerBase + "?j=";
    var lines = desc.split("\n"), kept = [], at = -1;
    for (var k = 0; k < lines.length; k++) {
      if (lines[k].indexOf(marker) !== -1) { if (at < 0) at = kept.length; }
      else kept.push(lines[k]);
    }
    var out;
    if (at >= 0) { kept.splice.apply(kept, [at, 0].concat(block)); out = kept.join("\n"); }
    else out = desc.trim() ? block.join("\n") + "\n\n" + desc : block.join("\n");
    return out.length > DESC_MAX ? null : out;
  }
  function withLink(desc, job, viewerBase) { return withLinks(desc, [job], viewerBase); }

  var api = { roomWords: roomWords, match: match, matchAll: matchAll, resolve: resolve, withLink: withLink, withLinks: withLinks, linkLine: linkLine, rank: rank, jobNumber: jobNumber, words: words };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PFMatch = api;
})(this);
