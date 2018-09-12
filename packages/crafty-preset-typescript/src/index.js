const path = require("path");

const createTask = require("./gulp");
const createTempFile = require("./utils").createTempFile;

const MODULES = path.join(__dirname, "..", "node_modules");

function resolve(relative) {
  return path.resolve(process.cwd(), relative);
}

function absolutePath(item) {
  return path.isAbsolute(item) ? item : path.join(process.cwd(), item);
}

module.exports = {
  defaultConfig() {
    return {
      bundleTypes: { js: "js" },
      // TSLint config
      tslint: require("./config-tslint.js")
    };
  },
  commands() {
    return {
      tsLint: {
        //eslint-disable-next-line no-unused-vars
        command: function(crafty, input, cli) {
          // Remove command argument
          process.argv.splice(process.argv.indexOf("tsLint"), 1);

          global.craftyConfig = crafty.config;
          require("./commands/tsLint");
        },
        description: "Lint TypeScript for errors"
      }
    };
  },
  bundleCreator(crafty) {
    const configurators = { js: {} };

    if (
      crafty.config.loadedPresets.some(
        preset => preset.presetName === "@swissquote/crafty-runner-gulp"
      )
    ) {
      configurators.js["gulp/typescript"] = (
        craftyAgain,
        bundle,
        gulp,
        StreamHandler
      ) => {
        gulp.task(
          bundle.taskName,
          createTask(craftyAgain, bundle, StreamHandler)
        );
        craftyAgain.watcher.add(bundle.watch || bundle.source, bundle.taskName);
      };
    }

    return configurators;
  },
  rollup(crafty, bundle, rollupConfig) {
    rollupConfig.input.plugins.typescript = {
      plugin: require("rollup-plugin-typescript2"),
      weight: 20
    };

    // Linting doesn't work well currently in rollup
    // - Errors are imprecise, just outputs "Warnings or errors were found"
    // - If the code can't be parsed, you lose the information of where it failed
    //rollupConfig.input.plugins.tslint = {
    //  plugin: require("rollup-plugin-tslint"),
    //  weight: 0,
    //  options: {
    //    exclude: ["node_modules/**"],
    //    include: ["**/*.ts", "**/*.tsx"],
    //    configuration: createTempFile(JSON.stringify(crafty.config.tslint)),
    //    throwError: true // TODO :: throw only on warning
    //  }
    //};
  },
  jest(crafty, options) {
    options.moduleDirectories.push(MODULES);
    options.transform["^.+\\.tsx?$"] = require.resolve(
      "ts-jest/preprocessor.js"
    );

    options.moduleFileExtensions.push("ts");
    options.moduleFileExtensions.push("tsx");
  },
  webpack(crafty, bundle, chain) {
    chain.resolve.extensions.add(".ts").add(".tsx");
    chain.resolve.modules.add(MODULES);
    chain.resolveLoader.modules.add(MODULES);

    const filename = createTempFile(JSON.stringify(crafty.config.tslint));

    // TypeScript linting
    chain.module
      .rule("lint-ts")
      .pre() // It's important to do this before TypeScript processes the JS.
      .test(/\.tsx?$/)
      .include.add(resolve("js"))
      .end()
      .use("tslint")
      .loader("tslint-loader")
      .options({
        configFile: filename,
        formatter: "stylish"
      });

    // TypeScript
    const tsRule = chain.module.rule("ts");
    tsRule.test(/\.tsx?$/);
    tsRule.exclude.add(/(node_modules|bower_components)/);

    const babelConfigurator = require("@swissquote/babel-preset-swissquote/configurator");
    const babelOptions = babelConfigurator(
      crafty,
      crafty.getEnvironment() === "production" ? "production" : "development",
      bundle,
      {
        deduplicateHelpers: true,
        useESModules: true
      }
    );

    // Cache can be disabled for experimentation and when running Crafty's tests
    if (
      crafty.getEnvironment() === "production" &&
      !process.argv.some(arg => arg === "--no-cache") &&
      !process.env.TESTING_CRAFTY
    ) {
      babelOptions.cacheDirectory = true;
    }

    // EcmaScript 2015+
    tsRule
      .use("babel")
      .loader("babel-loader")
      .options(babelOptions);

    const tsOptions = {
      compilerOptions: {
        // Transpile to esnext so that Babel can apply all its magic
        target: "ESNext",
        // Preserve JSX so babel can optimize it, or add development/debug information
        jsx: "Preserve"
      }
    };

    tsRule
      .use("ts-loader")
      .loader("ts-loader")
      .options(tsOptions);
  }
};
