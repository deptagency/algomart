#!/usr/bin/env bash

# Ensure errors exits the script
set -e

echo "Ensure we are in apps/cms/scripts"
cd $(dirname -- "$(readlink -f "${BASH_SOURCE}")")
echo "Executing from $(pwd)"

NEW_VERSION="9.16.1"
FILES=($(find ../extensions -name "package.json" | grep -v node_modules))

f=../../../package.json
echo Updating root package.json...
jq --arg a "${NEW_VERSION}" '.["dependencies"].directus = $a' $f >"tmp" && mv "tmp" $f
jq --arg a "${NEW_VERSION}" '.["dependencies"]."@directus/sdk" = $a' $f >"tmp" && mv "tmp" $f
jq --arg a "${NEW_VERSION}" '.["devDependencies"]."@directus/extensions-sdk" = $a' $f >"tmp" && mv "tmp" $f

grep directus $f

#############
echo
echo Updating the cms Dockerfile...

f=../../../docker/deploy/cms/Dockerfile
sed "s/ directus\@.* --/ directus\@$NEW_VERSION --/g" $f > "tmp" && mv "tmp" $f

grep directus $f

#############

echo
echo Extension starting values:
for f in "${FILES[@]}"; do
  echo "$f: " $(grep host $f)
done

echo
for f in "${FILES[@]}"; do
  jq --arg a "${NEW_VERSION}" '.["directus:extension"].host = $a' $f >"tmp" && mv "tmp" $f
done
echo

echo Extension ending values:
for f in "${FILES[@]}"; do
  echo "$f: " $(grep host $f)
done

#############

echo
echo Run npm install from root...
echo
cd ../../../
npm install

#############

echo
echo Export the cms snapshot...
echo
nx export cms
cd apps/cms/
echo
ls -al snapshot.yml

#############

echo
echo Building extensions...
echo

BUILD_ARRAY=()
LINE_ARRAY=($(grep build package.json))
for f in "${LINE_ARRAY[@]}"; do
  if [[ "$f" == *"build-"* ]]; then
    BUILD1=$(sed 's/\"://g' <<<$f)
    BUILD2=$(sed 's/\"//g' <<<$BUILD1)
    BUILD_ARRAY+=($BUILD2)
  fi
done

echo $BUILD_ARRAY

for f in "${BUILD_ARRAY[@]}"; do
  nx $f cms
done

#############

