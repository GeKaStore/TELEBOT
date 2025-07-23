const chalk = require("chalk");
const getDateTime = require("./getDateTime");
const { log } = require("console");

module.exports = (type, event, message) => {
  const dateTime = getDateTime();
  switch (type.toLowerCase()) {
    case "error":
      log(
        `${chalk.bold.white.bgRed(`\x20${global.name}\x20`)}\x20${chalk.gray(
          dateTime
        )}\n${chalk.bold.white.bgRed(
          `\x20${event.toUpperCase()}\x20`
        )}\x20${message}\n`
      );
      break;
    case "info":
      log(
        `${chalk.bold.white.bgCyan(`\x20${global.name}\x20`)}\x20${chalk.gray(
          dateTime
        )}\n${chalk.bold.white.bgCyan(
          `\x20${event.toUpperCase()}\x20`
        )}\x20${message}\n`
      );
      break;
    case "primary":
      log(
        `${chalk.bold.white.bgRgb(
          80,
          120,
          255
        )(`\x20${global.name}\x20`)}\x20${chalk.gray(
          dateTime
        )}\n${chalk.bold.white.bgRgb(
          80,
          120,
          255
        )(`\x20${event.toUpperCase()}\x20`)}\x20${message}\n`
      );
      break;
  }
};
