# `setup-xc`

***Install a specific [xc](https://xcfile.dev) CLI version on your Github
Actions runner***

Use this action in your github actions workflow to install a specific version of
[xc](https://xcfile.dev) on your runner. `version` is a semantic version
string like `v0.4.0`. You can also use the keyword `latest` (default) to use the
latest stable release of `xc`. Releases of `xc` are listed
[here](https://github.com/joerdav/xc/releases).

```
- uses: joerdav/setup-xc@v1
  with:
    version: '<version>' # default is latest
  id: install
```

Please refer to [`action.yml`](action.yml) for more details.

The cached `xc` binary path is prepended to the `PATH` environment variable and
can be executed directly in later workflow steps. It is also stored in the
`xc-path` output variable.

## Tasks

## test

Run the tests

requires: install

```
npm run test
```
## install

Install dependencies

```
npm i
```
