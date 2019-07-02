/* global describe, it, expect */

const fs = require("fs");
const path = require("path");

const rimraf = require("rimraf");
const configuration = require("@swissquote/crafty/src/configuration");

const testUtils = require("../utils");

const getCrafty = configuration.getCrafty;

it("Loads crafty-preset-maven, crafty-preset-babel and overrides configuration", () => {
  process.chdir(path.join(__dirname, "../fixtures/crafty-preset-maven/webapp"));
  const config = { mavenType: "webapp" };
  const crafty = getCrafty(
    ["@swissquote/crafty-preset-maven", "@swissquote/crafty-preset-babel"],
    config
  );

  const loadedPresets = crafty.config.loadedPresets.map(
    preset => preset.presetName
  );
  expect(loadedPresets).toContain("@swissquote/crafty-preset-maven");
  expect(loadedPresets).toContain("@swissquote/crafty-preset-babel");

  expect(crafty.config.destination.replace(`${process.cwd()}/`, "")).toEqual(
    "target/my-app-1.0.0-SNAPSHOT/resources"
  );

  expect(crafty.config.destination_js.replace(`${process.cwd()}/`, "")).toEqual(
    "target/my-app-1.0.0-SNAPSHOT/resources/js"
  );
});

it("Fails if no pom is found", async () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-maven/missing-pom")
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  expect(fs.existsSync("dist/js/myBundle.min.js")).toBeTruthy();
});

it("Places files in target of a webapp", async () => {
  process.chdir(path.join(__dirname, "../fixtures/crafty-preset-maven/webapp"));
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  expect(
    fs.existsSync("target/my-app-1.0.0-SNAPSHOT/resources/js/myBundle.min.js")
  ).toBeTruthy();
});

it("Reads env. var before pom.xml", async () => {
  process.chdir(
    path.join(__dirname, "../fixtures/crafty-preset-maven/env-override")
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"], {
    env: { TARGET_BASEDIR: path.join(process.cwd(), "target/some_basedir") }
  });

  expect(result).toMatchSnapshot();

  expect(
    fs.existsSync("target/some_basedir/resources/js/myBundle.min.js")
  ).toBeTruthy();
});

it("Places files in target of a webapp from within a subfolder", async () => {
  process.chdir(
    path.join(
      __dirname,
      "../fixtures/crafty-preset-maven/subfolder/src/main/frontend"
    )
  );
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  expect(
    fs.existsSync(
      "../../../target/my-app-1.0.0-SNAPSHOT/resources/js/myBundle.min.js"
    )
  ).toBeTruthy();
});

it("Places files in target of a webjar", async () => {
  process.chdir(path.join(__dirname, "../fixtures/crafty-preset-maven/webjar"));
  rimraf.sync("dist");

  const result = await testUtils.run(["run", "default"]);

  expect(result).toMatchSnapshot();

  expect(
    fs.existsSync(
      "target/classes/META-INF/resources/webjars/js/myBundle.min.js"
    )
  ).toBeTruthy();
});
