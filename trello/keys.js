/* Which Trello API key to use. Keys are public by design; each user's token is not
   stored here. A custom Power-Up belongs to one workspace, so the test board and the
   company boards are two Power-Ups with two keys, sharing this code. */
(function (root) {
  var TEST_BOARD = "696ef92c12f1e2d0cae2128f";       // Auto Site Install (test workspace)
  var TEST_KEY = "8b843778d4d799d1f5fe1d7a0db89b0b";
  var MAIN_KEY = "704e82fa29aaf32f15335d5d929c6b9b";   // company workspace
  function appKeyFor(boardId) { return boardId === TEST_BOARD ? TEST_KEY : MAIN_KEY; }
  var api = { appKeyFor: appKeyFor, TEST_BOARD: TEST_BOARD, TEST_KEY: TEST_KEY, MAIN_KEY: MAIN_KEY };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PFKeys = api;
})(this);
