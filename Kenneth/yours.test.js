// utils.js
function add(a, b) {
  return a + b;
}

// module.exports = { add };

// utils.test.js
// const { add } = require("./utils");

test("adds 1 + 2 to equal 3", () => {
  expect(add(1, 2)).toBe(3);
});
module.exports = { add };
