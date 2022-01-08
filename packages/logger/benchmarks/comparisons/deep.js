'use strict';

const bench = require('fastbench');

const { Logger } = require('../../lib');
const pino = require('pino');

const logger = new Logger();
const pinoLogger = new pino();
const max = 10;

const deep = Object.assign({}, require('../../package.json'), {
  level: 'info',
});

const run = bench(
  [
    function benchLogger(cb) {
      for (var i = 0; i < max; i++) {
        logger.info('deep object comparison', deep);
      }
      setImmediate(cb);
    },
    function benchConsole(cb) {
      for (var i = 0; i < max; i++) {
        console.info('deep object comparison', deep);
      }
      setImmediate(cb);
    },
    function benchPino(cb) {
      for (var i = 0; i < max; i++) {
        pinoLogger.info('deep object comparison', deep);
      }
      setImmediate(cb);
    },
  ],
  10000
);

run(run());
