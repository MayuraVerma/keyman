#!/bin/bash
# $1 - project name with appended tier, e.g. keyman-alpha
# $2 - GPG key used for signing the source package

set -e
set -u

## START STANDARD BUILD SCRIPT INCLUDE
# adjust relative paths as necessary
THIS_SCRIPT="$(greadlink -f "${BASH_SOURCE[0]}" 2>/dev/null || readlink -f "${BASH_SOURCE[0]}")"
. "$(dirname "$THIS_SCRIPT")/../../resources/build/build-utils.sh"
## END STANDARD BUILD SCRIPT INCLUDE

. "$KEYMAN_ROOT/resources/shellHelperFunctions.sh"

. "$THIS_SCRIPT_PATH/package-build.inc.sh"

keyman_projects="keyman"

tier="stable"

if [[ "$1" =~ "-alpha" ]]; then
    tier="alpha"
elif [[ "$1" =~ "-beta" ]]; then
    tier="beta"
fi

proj="$1"
proj=${proj%"-alpha"}
proj=${proj%"-beta"}

fullsourcename="keyman"
sourcedir="$KEYMAN_ROOT"
sourcename=${fullsourcename%"-alpha"}
sourcename=${sourcename%"-beta"}

# set Debian/changelog environment
export DEBFULLNAME="${fullsourcename} Package Signing Key"
export DEBEMAIL='jenkins@sil.org'

checkAndInstallRequirements

# clean up prev deb builds
echo_heading "cleaning previous builds of $1"

rm -rf builddebs
rm -rf "$sourcedir/${1}"_*.{dsc,build,buildinfo,changes,tar.?z,log}
rm -rf "$sourcedir/../${1}"_*.{dsc,build,buildinfo,changes,tar.?z,log}

echo_heading "Make source package for $fullsourcename"
echo_heading "reconfigure"
TIER="$tier" ./scripts/reconf.sh

echo_heading "Make origdist"
./scripts/dist.sh origdist
echo_heading "Make deb source"
./scripts/deb.sh sourcepackage

#sign source package
for file in builddebs/*.dsc; do
	echo_heading "Signing source package $file"
	debsign -k"$2" "$file"
done

mv builddebs/* ..
