"use strict";

const bench = require("fastbench");

const { Logger } = require("../lib");
const logger = new Logger();

const max = 10;

const run = bench(
  [
    function benchLogger(cb) {
      for (var i = 0; i < max; i++) {
        logger.info("hello");
      }
      setImmediate(cb);
    },
  ],
  1000
);

run(run());
