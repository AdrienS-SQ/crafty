const path = require("path");
const fs = require("fs");

const chalk = require("chalk");
const webpackMerge = require("webpack-merge");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const mkdirp = require("mkdirp");
const debug = require("debug")("crafty-runner-webpack");

const formatWebpackMessages = require("./utils/formatWebpackMessages");
const portFinder = require("./utils/find-port");
const webpackConfigurator = require("./webpack");

function prepareConfiguration(crafty, bundle, webpackPort) {
  // Base configuration
  let webpackConfig = webpackConfigurator(crafty, bundle, webpackPort);

  const configPath = path.join(process.cwd(), "webpack.config.js");

  if (fs.existsSync(configPath)) {
    crafty.log("Merging SQ webpack config with " + chalk.magenta(configPath));
    webpackConfig = webpackMerge.smart(webpackConfig, require(configPath));
  }

  debug("Webpack configuration", webpackConfig);

  return webpackConfig;
}

function onDone(crafty, webpackConfig, compiler, bundle) {
  return stats => {
    // If we are in watch mode, the bundle is only generated in memory
    // This will copy it to disk, to make refreshes work fine
    // as we don't use the dev-server as a proxy
    if (crafty.isWatching()) {
      const file = path.join(
        webpackConfig.output.path,
        webpackConfig.output.filename
      );
      compiler.outputFileSystem.readFile(file, (err, result) => {
        if (err) {
          throw err;
        }

        mkdirp.sync(path.dirname(file));

        fs.writeFile(file, result, err2 => {
          if (err2) {
            throw err2;
          }
        });
      });
    }

    // Write stats
    console.log(
      stats.toString({
        colors: chalk.supportsColor,
        hash: false, // We don't use hashes
        version: false, // This is just noise
        errors: false, // Errors are printed separately
        warnings: false, // Warnings are printed separately
        timings: crafty.loglevel > 1,
        cached: crafty.loglevel > 1
      })
    );

    // Write a complete profile for the webpack run if needed
    if (webpackConfig.profile) {
      const profile = `${webpackConfig.output.path}${path.sep}${
        bundle.name
      }.json`;

      mkdirp.sync(path.dirname(profile));

      fs.writeFile(profile, JSON.stringify(stats.toJson()), err3 => {
        if (!err3) {
          console.log(`Profile written to '${profile}'`);
        }
      });
    }

    // Nicer Error/Warning Messages
    console.log();
    console.log();
    let messages = formatWebpackMessages(stats.toJson({}, true));

    // If errors exist, only show errors.
    if (messages.errors.length) {
      console.log(chalk.red("Failed to compile."));
      console.log();
      messages.errors.forEach(message => {
        console.log(message);
        console.log();
      });
      return;
    }

    // Show warnings if no errors were found.
    if (messages.warnings.length) {
      console.log(chalk.yellow("Compiled with warnings."));
      console.log();
      messages.warnings.forEach(message => {
        console.log(message);
        console.log();
      });
      return;
    }

    console.log(chalk.green("Compiled successfully!"));
  };
}

// Print out errors
function printErrors(summary, errors) {
  console.log(summary);
  console.log();
  errors.forEach(err => {
    console.log(err.message || err);
    console.log();
  });
}

/**
 * Prepare execution for both watch and single run
 *
 * @param {Crafty} crafty The crafty instance
 * @param {object} bundle The current bundle's configuration
 * @returns {function(*=)} The gulp task
 */
module.exports = function jsTaskES6(crafty, bundle) {
  const taskName = bundle.taskName;
  let webpackPort = null;
  const compilerReady = portFinder.getFree(taskName).then(freePort => {
    try {
      webpackPort = freePort;
      const webpackConfig = prepareConfiguration(crafty, bundle, freePort);
      const compiler = webpack(webpackConfig);

      // "invalid" event fires when you have changed a file, and Webpack is
      // recompiling a bundle. WebpackDevServer takes care to pause serving the
      // bundle, so if you refresh, it'll wait instead of serving the old one.
      // "invalid" is short for "bundle invalidated", it doesn't imply any errors.
      compiler.plugin("invalid", () => {
        console.log("Compiling...");
      });

      compiler.plugin("done", onDone(crafty, webpackConfig, compiler, bundle));

      if (compiler) {
        return Promise.resolve(compiler);
      } else {
        return Promise.reject("Could not create compiler");
      }
    } catch (e) {
      return Promise.reject(e);
    }
  });

  // This is executed in watch mode only
  let runningWatcher = null;
  crafty.watcher.addRaw({
    start: () => {
      compilerReady
        .then(
          compiler => {
            // Prepare the Hot Reload Server
            runningWatcher = new WebpackDevServer(compiler, {
              stats: false,
              hot: true,
              hotOnly: true,
              headers: {
                "Access-Control-Allow-Origin": "*"
              }
            });

            runningWatcher.listen(webpackPort, "localhost", function(err) {
              if (err) {
                throw new util.PluginError("webpack-dev-server", err);
              }
              crafty.log(
                "[webpack-dev-server]",
                "Started, listening on localhost:" + webpackPort
              );
            });
          },
          e => {
            crafty.log.error("[webpack-dev-server]", "Could not start", e);
          }
        )
        .catch(e => {
          crafty.log.error("[webpack-dev-server]", "Could not start", e);
        });
    }
  });

  // This is executed in single-run only
  crafty.undertaker.task(taskName, cb => {
    compilerReady.then(compiler => {
      try {
        compiler.run((err, stats) => {
          if (err) {
            printErrors("Failed to compile.", [err]);
            return cb("Webpack compilation failed");
          }

          if (stats.compilation.errors && stats.compilation.errors.length) {
            // Those errors are printed by "onDone"
            //printErrors('Failed to compile.', stats.compilation.errors);
            return cb("Webpack compilation failed");
          }

          return cb();
        });
      } catch (e) {
        printErrors("Failed to compile.", [e]);
        cb(e);
      }
    }, cb);
  });
};
