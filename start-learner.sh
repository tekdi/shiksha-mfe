#!/bin/bash
# Runs the learner app (3003) and the players app (4108) from their standalone builds; stops both on a signal or if either exits.
cd /workspace
PORT=3003 HOSTNAME=0.0.0.0 node apps/learner-web-app/server.js &
PORT=4108 HOSTNAME=0.0.0.0 node mfes/players/server.js &
trap 'kill $(jobs -p) 2>/dev/null' TERM INT
wait -n
code=$?
kill $(jobs -p) 2>/dev/null
exit $code
