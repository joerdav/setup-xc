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

### test

Run the tests

requires: install

```
npm run test
```
### install

Install dependencies

```
npm i
```

### tag

Deploys a new tag for the repo.

Specify major/minor/patch with VERSION

Inputs: VERSION

Requires: test

```
# https://github.com/unegma/bash-functions/blob/main/update.sh

CURRENT_VERSION=`git describe --abbrev=0 --tags 2>/dev/null`
CURRENT_VERSION_PARTS=(${CURRENT_VERSION//./ })
VNUM1=${CURRENT_VERSION_PARTS[0]}
VNUM2=${CURRENT_VERSION_PARTS[1]}
VNUM3=${CURRENT_VERSION_PARTS[2]}

if [[ $VERSION == 'major' ]]
then
  VNUM1=$((VNUM1+1))
  VNUM2=0
  VNUM3=0
elif [[ $VERSION == 'minor' ]]
then
  VNUM2=$((VNUM2+1))
  VNUM3=0
elif [[ $VERSION == 'patch' ]]
then
  VNUM3=$((VNUM3+1))
else
  echo "Invalid version"
  exit 1
fi

NEW_TAG="$VNUM1.$VNUM2.$VNUM3"

echo Adding git tag with version ${NEW_TAG}
git tag ${NEW_TAG}
git push origin ${NEW_TAG}
```

