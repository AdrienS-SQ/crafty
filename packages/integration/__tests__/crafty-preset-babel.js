/* global describe, it, expect, jest */

const fs = require("fs");
const path = require("path");

const rimraf = require("rimraf");
const configuration = require("@swissquote/crafty/src/configuration");
const getCommands = require("@swissquote/crafty/src/commands/index");

const testUtils = require("../utils");

const getCrafty = configuration.getCrafty;

// node-forge 0.6.33 doesn't work with jest.
// but selfsigned is fixed on this version
// as we don't use it for now, we can simply mock it
// https://github.com/jfromaniello/selfsigned/issues/16
jest.mock("node-forge");

const PRESET_BABEL = "@swissquote/crafty-preset-babel";

it("Loads crafty-preset-babel and does not register webpack tasks", () => {
  const crafty = getCrafty([PRESET_BABEL], {});

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain(PRESET_BABEL);

  const commands = getCommands(crafty);
  expect(Object.keys(commands)).toContain("jsLint");

  crafty.createTasks();
  expect(Object.keys(crafty.undertaker._registry.tasks())).toEqual([]);
});

it("Loads crafty-preset-babel, crafty-runner-webpack and registers webpack task", () => {
  const config = { js: { myBundle: { source: "css/style.scss" } } };
  const crafty = getCrafty(
    [PRESET_BABEL, "@swissquote/crafty-runner-webpack"],
    config
  );

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain(PRESET_BABEL);
  expect(loadedPresets).toContain("@swissquote/crafty-runner-webpack");

  const commands = getCommands(crafty);
  expect(Object.keys(commands)).toContain("jsLint");

  crafty.createTasks();
  expect(Object.keys(crafty.undertaker._registry.tasks())).toEqual([
    "js_myBundle",
    "js",
    "default"
  ]);
});

it("Fails on double runner with incorrect bundle assignment", () => {
  const config = { js: { myBundle: { source: "css/style.scss" } } };
  const crafty = getCrafty(
    [
      PRESET_BABEL,
      "@swissquote/crafty-runner-gulp",
      "@swissquote/crafty-runner-webpack"
    ],
    config
  );

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain(PRESET_BABEL);
  expect(loadedPresets).toContain("@swissquote/crafty-runner-gulp");
  expect(loadedPresets).toContain("@swissquote/crafty-runner-webpack");

  expect(() => crafty.createTasks()).toThrow(
    "You have multiple runners, please specify a runner for 'myBundle'. Available runners are ['gulp/babel', 'webpack']."
  );
});

it("Fails on double runner with imprecise bundle assignment", () => {
  const config = {
    js: { myBundle: { runner: "gulp", source: "css/style.scss" } }
  };
  const crafty = getCrafty(
    [
      PRESET_BABEL,
      "@swissquote/crafty-preset-typescript",
      "@swissquote/crafty-runner-gulp"
    ],
    config
  );

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain(PRESET_BABEL);
  expect(loadedPresets).toContain("@swissquote/crafty-preset-typescript");
  expect(loadedPresets).toContain("@swissquote/crafty-runner-gulp");

  expect(() => crafty.createTasks()).toThrow(
    "More than one valid runner exists for 'myBundle'. Has to be one of ['gulp/babel', 'gulp/typescript']."
  );
});

it("Fails on non-existing runners", () => {
  const config = {
    js: { myBundle: { runner: "someRunner", source: "css/style.scss" } }
  };
  const crafty = getCrafty(
    [
      PRESET_BABEL,
      "@swissquote/crafty-preset-typescript",
      "@swissquote/crafty-runner-gulp"
    ],
    config
  );

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain(PRESET_BABEL);
  expect(loadedPresets).toContain("@swissquote/crafty-preset-typescript");
  expect(loadedPresets).toContain("@swissquote/crafty-runner-gulp");

  expect(() => crafty.createTasks()).toThrow(
    "Invalid runner 'someRunner' for 'myBundle'. Has to be one of ['gulp/babel', 'gulp/typescript']."
  );
});

it("Assigns bundle only once when runner is specified", () => {
  const config = {
    js: { myBundle: { runner: "webpack", source: "css/style.scss" } }
  };
  const crafty = getCrafty(
    [
      PRESET_BABEL,
      "@swissquote/crafty-runner-gulp",
      "@swissquote/crafty-runner-webpack"
    ],
    config
  );

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain(PRESET_BABEL);
  expect(loadedPresets).toContain("@swissquote/crafty-runner-gulp");
  expect(loadedPresets).toContain("@swissquote/crafty-runner-webpack");

  const commands = getCommands(crafty);
  expect(Object.keys(commands)).toContain("jsLint");

  crafty.createTasks();
  expect(Object.keys(crafty.undertaker._registry.tasks())).toEqual([
    "js_myBundle",
    "js",
    "default"
  ]);
});

it("Lints JavaScript using command", () => {
  process.chdir(path.join(__dirname, "../fixtures/crafty-preset-babel/lints"));
  rimraf.sync("dist");

  const result = testUtils.run(["jsLint", "js/**/*.js"]);

  expect(result).toMatchSnapshot();

  // Files aren't generated on failed lint
  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeFalsy();
});

it("Generates IDE Helper", () => {
  process.chdir(path.join(__dirname, "../fixtures/crafty-preset-babel/ide"));
  rimraf.sync(".eslintrc.js");
  rimraf.sync("prettier.config.js");
  rimraf.sync(".gitignore");

  const result = testUtils.run(["ide"]);

  expect(result).toMatchSnapshot();

  expect(testUtils.readForSnapshot(".eslintrc.js")).toMatchSnapshot();

  expect(testUtils.readForSnapshot("prettier.config.js")).toMatchSnapshot();

  expect(testUtils.readForSnapshot(".gitignore")).toMatchSnapshot();
});

it("Lints JavaScript using command, ignore crafty.config.js", () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-babel/lints-ignore-config")
  );
  rimraf.sync("dist");

  const result = testUtils.run([
    "--preset",
    PRESET_BABEL,
    "--ignore-crafty-config",
    "jsLint",
    "crafty.config.js"
  ]);

  expect(result).toMatchSnapshot();

  // Files aren't generated on failed lint
  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeFalsy();
});

it("Lints JavaScript using command, legacy", () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-babel/lints-es5")
  );
  rimraf.sync("dist");

  const result = testUtils.run(["jsLint", "js/**/*.js", "--preset", "legacy"]);

  expect(result).toMatchSnapshot();

  // Files aren't generated on failed lint
  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeFalsy();
});

it("Lints JavaScript using command, recommended preset", () => {
  process.chdir(path.join(__dirname, "../fixtures/crafty-preset-babel/lints"));
  rimraf.sync("dist");

  const result = testUtils.run([
    "jsLint",
    "js/**/*.js",
    "--preset",
    "recommended"
  ]);

  expect(result).toMatchSnapshot();

  // Files aren't generated on failed lint
  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeFalsy();
});

it("Lints JavaScript using command, explicit configuration", () => {
  process.chdir(path.join(__dirname, "../fixtures/crafty-preset-babel/lints"));
  rimraf.sync("dist");

  const result = testUtils.run([
    "jsLint",
    "js/**/*.js",
    "--config",
    "eslintOverride.json"
  ]);

  expect(result).toMatchSnapshot();

  // Files aren't generated on failed lint
  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeFalsy();
});
