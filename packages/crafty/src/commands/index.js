const debug = require("debug")("commands");
const merge = require("merge");

function getCommands(crafty) {
  debug("Registering Commands");
  let commands = {};
  crafty.getImplementations("commands").forEach(preset => {
    debug(`${preset.presetName}.commands(crafty)`);
    commands = merge.recursive(true, commands, preset.commands(crafty));
  });
  commands.run = require("./run.js");
  commands.watch = require("./watch.js");
  commands.test = require("./testCommand.js");

  return commands;
}

module.exports = getCommands;
