// node test/match.test.js
var M = require("../match.js");
var jobs = [
  { key: "j1081-61-howitt-laundry", name: "J1081 - 61 Howitt Laundry", number: "J1081", room: "Laundry" },
  { key: "j974-cathy-john-bain", name: "J974 - Cathy & John Bain", number: "J974", room: "Kitchen" },
  { key: "j1093-62-florizel-street-kitchen-pantry", name: "J1093 - 62 Florizel Street - Kitchen & Pantry", number: "J1093", room: "Kitchen & Pantry" },
  { key: "andy-joni-kitchen", name: "Andy & Joni Kitchen", number: "", room: "Kitchen" },
];
var fail = 0;
function eq(name, got, want) {
  var ok = got === want;
  if (!ok) fail++;
  console.log((ok ? "ok  " : "FAIL") + "  " + name + (ok ? "" : "   got " + got + ", want " + want));
}
function key(card, js) { var r = M.match(card, js || jobs); return r.job ? r.job.key : null; }

eq("number + name", key("J974 - Cathy & John Bain - Room 1"), "j974-cathy-john-bain");
eq("number only", key("J974"), "j974-cathy-john-bain");
eq("lowercase / no space", key("j1093 florizel"), "j1093-62-florizel-street-kitchen-pantry");
eq("J-1081 style", key("J-1081 Howitt"), "j1081-61-howitt-laundry");
eq("no number on job, name match", key("J1100 - Andy & Joni Kitchen"), "andy-joni-kitchen");
eq("unknown number never picks a numbered job", key("J279 - Trello Testing Job - Room 1"), null);
eq("J97 does not match J974", key("J97 - Bain"), null);
eq("strong name match never overrides a different number", key("J1100 - Cathy John Bain"), null);
eq("one shared word is not enough", key("Kitchen"), null);

var twoRooms = jobs.concat([{ key: "j974-bain-laundry", name: "J974 - Cathy & John Bain - Laundry", number: "J974", room: "Laundry" }]);
eq("two rooms, room named on card", key("J974 - Bain - Laundry", twoRooms), "j974-bain-laundry");
eq("two rooms, room not named -> ask", key("J974 - Bain", twoRooms), null);
eq("two rooms -> both offered", M.match("J974 - Bain", twoRooms).candidates.length, 2);
eq("two rooms reason", M.match("J974 - Bain", twoRooms).reason, "several-rooms");

eq("resolve: pin wins over match", M.resolve("J974 - Bain", jobs, "andy-joni-kitchen").job.key, "andy-joni-kitchen");
eq("resolve: missing pin falls back to match", M.resolve("J974 - Bain", jobs, "gone").job.key, "j974-cathy-john-bain");
eq("resolve: missing pin is reported", M.resolve("J974 - Bain", jobs, "gone").pinMissing, true);
eq("resolve: no pin, no match -> null", M.resolve("J279 - Testing", jobs, "").job, null);
eq("real card name", key("J974 - Cathy & John Bain 10 Morris Rd Upper Beaconsfield - Kitchen"), "j974-cathy-john-bain");

// Real 3 - Factory card names, 6 Oct 2026. Only one room per job has a 3D model.
var factory = {
  "J974 - Cathy & John Bain 10 Morris Rd Upper Beaconsfield - Kitchen": "j974-cathy-john-bain",
  "J1093 - Veronica Podhorodecki 62 Florizel Street, Glen Iris - Kitchen - Laundry/Pantry": "j1093-62-florizel-street-kitchen-pantry",
  "J1093 - Veronica Podhorodecki 62 Florizel Street, Glen Iris - Bed 1+4 Robes": null,
  "J1093 - Veronica Podhorodecki 62 Florizel Street, Glen Iris - Vanity's": null,
  "J1093 - Veronica Podhorodecki 62 Florizel Street, Glen Iris - Hallway/Linen": null,
  "J1081 - 61 Howitt Rd - Silcon - Laundry": "j1081-61-howitt-laundry",
  "J1081 - 61 Howitt Rd - Silcon - Powder": null,
  "J1081 - 61 Howitt Rd - Silcon - Meditation Joinery": null,
  "J1081 - 61 Howitt Rd - Silcon - Pilates / Gym Joinery": null,
  "J1081 - 61 Howitt Rd - Silcon - Red Light Therapy Room": null,
  "J1081 - 61 Howitt Rd - Silcon - Seat Outside Sauna": null,
  "J1103 - AusStyle  - Rue De Gare Units - Unit 3 - Kitchen Pantry Laundry & Vanities": null,
  "Cecil kitchen flat pack - Kitchen": null,
  "J974 - Cathy & John Bain 10 Morris Rd Upper Beaconsfield": "j974-cathy-john-bain",
};
Object.keys(factory).forEach(function (n) { eq("factory: " + n.slice(0, 58), key(n), factory[n]); });
eq("other-room job is not even offered as likely", M.match("J1081 - 61 Howitt Rd - Silcon - Powder", jobs).candidates.length, 0);

var V = "https://masonn96-wq.github.io/part-finder/";
var bain = jobs[1], andy = jobs[3];
var live = "**[3D View: J974 - Cathy & John Bain (Kitchen)](https://masonn96-wq.github.io/part-finder/?j=j974-cathy-john-bain)**";
eq("link: line already on the J974 card is recognised as current", M.withLink(live, bain, V), live);
eq("link: empty description", M.withLink("", bain, V), live);
eq("link: goes on top, existing text kept", M.withLink("Benchtops 20mm\nT bar handles", bain, V), live + "\n\nBenchtops 20mm\nT bar handles");
var swapped = M.withLink("Notes\n" + live + "\nMore", andy, V);
eq("link: changed job replaces the line in place", swapped, "Notes\n" + M.linkLine(andy, V) + "\nMore");
eq("link: never two link lines", (swapped.match(/part-finder\/\?j=/g) || []).length, 1);
eq("link: brackets in a job name can't break the link", M.linkLine({ key: "k", name: "J1 [A]", room: "" }, V), "**[3D View: J1 A](" + V + "?j=k)**");
eq("link: refuses to overflow 16384", M.withLink(new Array(16380).join("x"), bain, V), null);
eq("link: other links left alone", M.withLink("[plans](https://example.com/a)", bain, V), live + "\n\n[plans](https://example.com/a)");

console.log(fail ? fail + " FAILED" : "all passed");
process.exit(fail ? 1 : 0);
