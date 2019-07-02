/* global describe, it, expect, jest */

const fs = require("fs");
const path = require("path");

const rimraf = require("rimraf");
const configuration = require("@swissquote/crafty/src/configuration");

const testUtils = require("../utils");

const getCrafty = configuration.getCrafty;

// node-forge 0.6.33 doesn't work with jest.
// but selfsigned is fixed on this version
// as we don't use it for now, we can simply mock it
// https://github.com/jfromaniello/selfsigned/issues/16
jest.mock("node-forge");

it("Loads crafty-preset-typescript and does not register webpack tasks", () => {
  const crafty = getCrafty(["@swissquote/crafty-preset-typescript"], {});

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain("@swissquote/crafty-preset-typescript");

  crafty.createTasks();
  expect(Object.keys(crafty.undertaker._registry.tasks())).toEqual([]);
});

it("Loads crafty-preset-typescript, crafty-runner-webpack and registers webpack task", () => {
  const config = { js: { myBundle: { source: "css/style.scss" } } };
  const crafty = getCrafty(
    [
      "@swissquote/crafty-preset-typescript",
      "@swissquote/crafty-runner-webpack"
    ],
    config
  );

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain("@swissquote/crafty-preset-typescript");
  expect(loadedPresets).toContain("@swissquote/crafty-runner-webpack");

  crafty.createTasks();
  expect(Object.keys(crafty.undertaker._registry.tasks())).toEqual([
    "js_myBundle",
    "js",
    "default"
  ]);
});

it("Compiles TypeScript", async () => {
  process.chdir(
    path.join(
      __dirname,
      "../fixtures/crafty-preset-typescript-webpack/compiles"
    )
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeTruthy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeTruthy();
  expect(fs.existsSync("dist/js/1.myBundle.min.js")).toBeTruthy();
  expect(fs.existsSync("dist/js/1.myBundle.min.js.map")).toBeTruthy();

  expect(
    fs.readFileSync("dist/js/myBundle.min.js").toString("utf8")
  ).toMatchSnapshot();
  expect(
    fs.readFileSync("dist/js/1.myBundle.min.js").toString("utf8")
  ).toMatchSnapshot();
  expect(
    fs.readFileSync("dist/js/js/SomeLibrary.d.ts").toString("utf8")
  ).toMatchSnapshot();
});

it("Compiles TypeScript - fork checker", async () => {
  process.chdir(
    path.join(
      __dirname,
      "../fixtures/crafty-preset-typescript-webpack/compiles-forked"
    )
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeTruthy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeTruthy();
  expect(fs.existsSync("dist/js/1.myBundle.min.js")).toBeTruthy();
  expect(fs.existsSync("dist/js/1.myBundle.min.js.map")).toBeTruthy();

  expect(
    fs.readFileSync("dist/js/myBundle.min.js").toString("utf8")
  ).toMatchSnapshot();
  expect(
    fs.readFileSync("dist/js/1.myBundle.min.js").toString("utf8")
  ).toMatchSnapshot();
});

it("Lints TypeScript with webpack", async () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-typescript-webpack/lints")
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  // Files aren't generated on failed lint
  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeFalsy();
});

it("Fails gracefully on broken markup", async () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-typescript-webpack/fails")
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  // Files aren't generated on failed lint
  expect(fs.existsSync("dist/js/myTSBundle.min.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/myTSBundle.min.js.map")).toBeFalsy();
});

it("Fails gracefully on invalid TS", async () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-typescript-webpack/invalid")
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  // Files aren't generated on failed types
  expect(fs.existsSync("dist/js/myTSBundle.min.js")).toBeFalsy();
  expect(fs.existsSync("dist/js/myTSBundle.min.js.map")).toBeFalsy();
});

it("Fails gracefully on invalid TS - fork checker", async () => {
  process.chdir(
    path.join(
      __dirname,
      "../fixtures/crafty-preset-typescript-webpack/invalid-forked"
    )
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  // Files aren't generated on failed types
  // TODO :: see if it can be done with fork TS Checker
  //expect(fs.existsSync("dist/js/myTSBundle.min.js")).toBeFalsy();
  //expect(fs.existsSync("dist/js/myTSBundle.min.js.map")).toBeFalsy();
});

it("Removes unused classes", async () => {
  process.chdir(
    path.join(
      __dirname,
      "../fixtures/crafty-preset-typescript-webpack/tree-shaking"
    )
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeTruthy();
  expect(fs.existsSync("dist/js/myBundle.min.js.map")).toBeTruthy();

  const content = fs.readFileSync("dist/js/myBundle.min.js").toString("utf8");

  expect(content.indexOf("From class A") > -1).toBeTruthy();
  expect(content.indexOf("From class B") > -1).toBeFalsy();
});
