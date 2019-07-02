/* global describe, it, expect */

const fs = require("fs");
const path = require("path");

const rimraf = require("rimraf");
const configuration = require("@swissquote/crafty/src/configuration");
const getCommands = require("@swissquote/crafty/src/commands/index");

const testUtils = require("../utils");

const getCrafty = configuration.getCrafty;

it("Loads crafty-preset-postcss and does not register gulp tasks", () => {
  const crafty = getCrafty(["@swissquote/crafty-preset-postcss"], {});

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain("@swissquote/crafty-preset-postcss");

  const commands = getCommands(crafty);
  expect(Object.keys(commands)).toContain("cssLint");

  crafty.createTasks();
  expect(Object.keys(crafty.undertaker._registry.tasks())).toEqual([]);
});

it("Lints with the command", async () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-postcss/no-bundle")
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["cssLint", "css/*.scss"]);

  expect(result).toMatchSnapshot();

  expect(fs.existsSync("dist")).toBeFalsy();
});

it("Lints with the command in legacy mode", async () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-postcss/no-bundle")
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["cssLint", "css/*.scss", "--preset", "legacy"]);

  expect(result).toMatchSnapshot();

  expect(fs.existsSync("dist")).toBeFalsy();
});

it("Lints with the command with custom config", async () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-postcss/no-bundle")
  );
  rimraf.sync("dist");

  const result = await testUtils.run([
    "cssLint",
    "css/*.scss",
    "--config",
    "stylelint.json"
  ]);

  expect(result).toMatchSnapshot();

  expect(fs.existsSync("dist")).toBeFalsy();
});

it("Creates IDE Integration files", async () => {
  process.chdir(path.join(__dirname, "../fixtures/crafty-preset-postcss/ide"));
  rimraf.sync("stylelint.config.js");
  rimraf.sync("prettier.config.js");
  rimraf.sync(".gitignore");

  const result = await testUtils.run(["ide"]);

  expect(result).toMatchSnapshot();
  expect(
    testUtils.snapshotizeOutput(
      fs.readFileSync("stylelint.config.js").toString("utf8")
    )
  ).toMatchSnapshot();

  expect(
    testUtils.snapshotizeOutput(
      fs.readFileSync("prettier.config.js").toString("utf8")
    )
  ).toMatchSnapshot();

  expect(
    testUtils.snapshotizeOutput(fs.readFileSync(".gitignore").toString("utf8"))
  ).toMatchSnapshot();
});
