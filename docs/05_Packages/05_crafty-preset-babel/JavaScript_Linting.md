Linting is the process of verifying your source code for common errors.

With the help of [ESLint](http://eslint.org) we created a default configuration that follows this standard.

[TOC]

## Fixing linting errors automatically

Many linting errors require an human mind to be fixed, but other don't.

__ESLint__ comes with a very useful command line flag to fix the errors automatically.

We bundled a [command line tool](../../CLI.md) that will leverage this and help you fix your JavaScript errors quickly

## Linting in development

Linting is important but while writing code, formatting is not the most important thing and failing the build for something as insignificant as a space is more annoying than helpful. That's why in Crafty, formatting rules are in warn-only mode during development (with `crafty watch`) so that you can focus on programming and not on formatting.

## Turning off linting for some parts of your code

You might find yourself surprised with the number of errors you get when you lint your javascript files for the first time.

Here I'll explain how to disable linting on some files or part of files, but remember! The linting is here to help you! You should disable it only for very good reasons.

Good reasons include:

- It's an external library you downloaded, so it should not follow our conventions
- you are adding a "console.log" but wrapped in a "if" statement to check if "console" exists in the global scope.

### Disable linting on a line

To be surgical you can also disable the linting on a single line with "eslint-disable-line"

Optionally, but it's recommended you can add which rules are disabled, in the following it is "no-console",
you can find the rule name at the end of the error message you get when compiling.

```javascript
if (console) {
    console.log("Les carottes sont cuites"); //eslint-disable-line no-console
}
```

### Disable linting on a block of code

You should use this possiblity with parcimony, but you can just add the following comments around your block

```javascript
/*eslint-disable */

//suppress all warnings between comments
alert('foo');

/*eslint-enable */
```

### Disable linting for one or more files

When running, __ESLint__ will look for a `.eslintignore` file in it's working directory and apply all the patterns to ignore some files.

The patterns in your .eslintignore file must match the [.gitignore syntax](https://git-scm.com/docs/gitignore).

For example:

```ignore
vendor/**.css
```

> The `.eslintignore` file's location changes wether you want to disable linting from __Crafty__ or the Mercurial hooks.
>
> For the hooks, the file must be at the root of your repository (next to your `.hgignore`/`.gitignore`).
>
> For __Crafty__, the file must be in the Gulp working directory (generally `src/main/frontend`).

## Customizing the rules

ESLint [contains a lot of rules](http://eslint.org/docs/rules/).

We created a default set of rules following the Swissquote JavaScript Guideline, but if your project wants stricter rules, you can enable them like that :

```javascript
module.exports = {
    eslint: {
        rules: {
            "arrow-parens": ["error", "always"]
        }
    }
};
```

You can set rules either for EcmaScript5 or EcmaScript6 (AKA EcmaScript2015)
