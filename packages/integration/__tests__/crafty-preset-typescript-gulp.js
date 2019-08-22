/* global describe, it, expect */

const fs = require("fs");
const path = require("path");

const rimraf = require("rimraf");
const configuration = require("@swissquote/crafty/src/configuration");

const testUtils = require("../utils");

const getCrafty = configuration.getCrafty;

it("Loads crafty-preset-typescript and does not register gulp tasks", () => {
  const crafty = getCrafty(["@swissquote/crafty-preset-typescript"], {});

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain("@swissquote/crafty-preset-typescript");

  crafty.createTasks();
  expect(Object.keys(crafty.undertaker._registry.tasks())).toEqual([]);
});

it("Loads crafty-preset-typescript, crafty-runner-gulp and registers gulp task", () => {
  const config = { js: { myBundle: { source: "js/**/*.ts" } } };
  const crafty = getCrafty(
    ["@swissquote/crafty-preset-typescript", "@swissquote/crafty-runner-gulp"],
    config
  );

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain("@swissquote/crafty-preset-typescript");
  expect(loadedPresets).toContain("@swissquote/crafty-runner-gulp");

  crafty.createTasks();
  expect(Object.keys(crafty.undertaker._registry.tasks())).toEqual([
    "js_myBundle",
    "js",
    "default"
  ]);
});

it("Compiles TypeScript", () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-typescript-gulp/compiles")
  );
  rimraf.sync("dist");

  const result = testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeFalsy();

  expect(fs.existsSync("dist/js/script.js")).toBeTruthy();
  expect(fs.existsSync("dist/js/script.js.map")).toBeTruthy();

  expect(fs.existsSync("dist/js/Component.js")).toBeTruthy();
  expect(fs.existsSync("dist/js/Component.js.map")).toBeTruthy();

  expect(testUtils.readForSnapshot("dist/js/script.js")).toMatchSnapshot();
  expect(testUtils.readForSnapshot("dist/js/Component.js")).toMatchSnapshot();
});

it("Compiles TypeScript and concatenates", () => {
  process.chdir(
    path.join(
      __dirname,
      "../fixtures/crafty-preset-typescript-gulp/concatenates"
    )
  );
  rimraf.sync("dist");

  const result = testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeTruthy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeTruthy();

  expect(fs.existsSync("dist/js/script.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/script.js.map")).toBeFalsy();

  expect(fs.existsSync("dist/js/otherfile.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/otherfile.js.map")).toBeFalsy();

  expect(
    testUtils.readForSnapshot("dist/js/myBundle.min.js")
  ).toMatchSnapshot();
});

it("Fails gracefully on broken markup", () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-typescript-gulp/fails")
  );
  rimraf.sync("dist");

  const result = testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  // Files aren't generated on failed lint
  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeFalsy();
});

it("Lints TypeScript", () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-typescript-gulp/lints")
  );
  rimraf.sync("dist");

  const result = testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  // Files aren't generated on failed lint
  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeFalsy();
});
