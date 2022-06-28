#!/bin/bash
set -e

pushd airdrop_contract
./build.sh
popd

pushd airdrop_factory
./build.sh
popd

pushd launchpad_contract
./build.sh
popd

pushd launchpad_factory
./build.sh
popd
