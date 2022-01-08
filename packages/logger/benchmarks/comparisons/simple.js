'use strict';

const bench = require('fastbench');

const { Logger } = require('../../lib');
const pino = require('pino');

const logger = new Logger();
const pinoLogger = new pino();
const max = 10;

const run = bench(
  [
    function benchLogger(cb) {
      for (var i = 0; i < max; i++) {
        logger.info('hello');
      }
      setImmediate(cb);
    },
    function benchConsole(cb) {
      for (var i = 0; i < max; i++) {
        console.info('hello');
      }
      setImmediate(cb);
    },
    function benchPino(cb) {
      for (var i = 0; i < max; i++) {
        pinoLogger.info('hello');
      }
      setImmediate(cb);
    },
  ],
  1000
);

run(run());
