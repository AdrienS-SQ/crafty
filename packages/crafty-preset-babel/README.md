<table>
<tr><th>Compatible Runners</th><td>

* [Gulp](05_Packages/02_crafty-runner-gulp.md)
* [rollup.js](05_Packages/02_crafty-runner-rollup.md)
* [Webpack](05_Packages/02_crafty-runner-webpack.md)

</td></tr>
<tr><th>Test Runners</th><td>

* [Jest](05_Packages/05_crafty-preset-jest.md)

</td></tr>
<tr><th>Linters</th><td>

Provides ESLint, configured with [`eslint-plugin-swissquote`](05_Packages/10_eslint-plugin-swissquote.md)

</td></tr>
<tr><th>Commands</th><td>

* `jsLint`: Lint JavaScript files, this is a facade for ESLint, pre-configured with our preset.

</td></tr>
</table>

[TOC]

## Description

The principle of CSS is very easy to grasp, yet CSS is very complicated to write at large scales.

We want to offer the best experience for writing CSS that is compatible with most browsers with a minimum overhead for the developer.

## Features

`babel-preset-webpack` is able to configure **Babel** with **Webpack** and **rollup.js**. This preset also supports **Gulp** but in this case only concatenates and minifies the files.

[Our Babel preset](05_Packages/10_babel-preset-swissquote.md)

[Read more](./JavaScript_Features.md)

## Linting

In `babel-preset-webpack` JavaScript is linted with **ESLint**, a very powerful pluggable linter, our configuration follows the Swissquote JavaScript Guideline.

[Read more](./JavaScript_Linting.md)

## Installation

```bash
npm install @swissquote/crafty-preset-babel --save
```

```javascript
module.exports = {
  presets: [
    "@swissquote/crafty-preset-babel",
    "@swissquote/crafty-runner-webpack", // optional
    "@swissquote/crafty-runner-gulp" // optional
  ],
  js: {
    app: {
      runner: "webpack", // Webpack, Gulp or rollup.js (optional if you have only one runner defined)
      source: "js/app.js"
    }
  }
};
```

## Usage

### With Webpack / rollup.js

Both runners have the same features in regards to Babel support.
They will resolve your modules recursively and bundle them in one file or more if you do some code-splitting.

#### JavaScript External assets

By default, all bundlers include all external dependencies in the final bundle, this works fine for applications, but if you wish to build a multi-tenant application or a library, you don't wish to include all dependencies, because you'll end up with the same dependency multiple times.

The `externals` option allows you to define a list of libraries that are provided and should not be embedded in the build, here is an example :

```javascript
module.exports = {
    ...
    // patterns are strings or globs
    externals: ["react", "react-dom", "squp", "squp/**"],
    ...
    js: {
        app: {
            // You can provide more items here, they will be merged with the main list for this bundle
            externals: ["my-plugin", "my-plugin/**"]
            ...
        }
    }
    ...
}
```

In this example `react`, `react-dom` and all modules starting with `squp/` will be treated as external

> You can see that globs were used here, note that they only work for Webpack, rollup.js needs complete strings.

### With Gulp

Gulp will not bundle your files like Webpack and rollup.js do, instead it will generate one output file per input file.
This is very useful if you are creating a library as it's the role of the final application to tree-shake what it doesn't need from your library.

Tree-shaking is very powerful but is sub-optimal on big files as many code patterns are recognized as side-effects and thus aren't removed from your bundle even if they aren't used.

## Usage with Jest

If you include both `crafty-preset-babel` and `crafty-preset-jest`.
When running your tests with `crafty test` this preset will be use to convert all `.js` and `.jsx` files (source and test files)

## Configuration

### Bundle options

| Option   | Type    | Optional ? | Runner | Description                                                                                                                     |
| -------- | ------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `concat` | Boolean | Yes        | Gulp   | This will merge all files together, outputting a single file. (This doesn't resolve imports, use Webpack or rollup.js for this) |

### Addind Babel plugins and presets

You can add, replace or remove plugins and add options to our default Babel configuration.
To see which plugins are already included, you can go to the [Swissquote Preset for Babel](05_Packages/10_babel-preset-swissquote.md) page.

```javascript
module.exports = {
  /**
   * Represents the extension point for Babel configuration
   * @param {Crafty} crafty - The instance of Crafty.
   * @param {Object} bundle - The bundle that is being prepared for build (name, input, source, destination)
   * @param {Object} babelConfig - The current Babel configuration
   */
  babel(crafty, bundle, babelConfig) {
    babelConfig.plugins.push("transform-es3-property-literals");
  }
};
```

Provided that you did `npm install --save-dev babel-plugin-transform-es5-property-mutators` before, Babel will now use this plugin as well in each run.

This method is called once per bundle, so you can customize each bundle's configuration differently.

### Linting options

You can read about the linting options in the page about [Read more](./JavaScript_Linting.md)

## Commands

### `crafty jsLint`

This linter will leverage ESLint to lint your JavaScript files with the Swissquote presets preinstalled. All [ESLint CLI](https://eslint.org/docs/user-guide/command-line-interface) options are valid here.

The additions made by this command are:

* Pre-configured rules, defined by [`eslint-plugin-swissquote`](05_Packages/10_eslint-plugin-swissquote.md) activated using `--preset`.
* Uses `babel-eslint` as a parser to support new syntax that ESLint doesn't understand yet.

there are 4 presets available for you :

* `format` Base formatting rules, should work on any code (included in `legacy` and `recommended`)
* `node` Adds environment information for nodejs
* `legacy` For all your ES5 code
* `recommended` For al your ES2015+ code, also contains rules for React

Setting presets is done with the `--preset` option

The order of the presets is important as some rules might override previous ones.

For example:

```bash
crafty jsLint src/** --preset format --preset node --preset recommended
```

If no preset is specified `recommended` is used.

If you pass the `--fix` flag it will fix all the errors it can and write them directly to the file.
