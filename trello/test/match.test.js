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

console.log(fail ? fail + " FAILED" : "all passed");
process.exit(fail ? 1 : 0);
