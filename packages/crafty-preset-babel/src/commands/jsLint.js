#!/usr/bin/env node

const fs = require("fs");

const tmp = require("tmp");

const configurationBuilder = require("../eslintConfigurator");

const configuration = configurationBuilder(process.argv);

process.argv = configuration.args;

const tmpfile = tmp.fileSync({ postfix: ".json" }).name;
fs.writeFileSync(tmpfile, JSON.stringify(configuration.configuration));

process.argv.push("--config");
process.argv.push(tmpfile);

require("eslint/bin/eslint");
