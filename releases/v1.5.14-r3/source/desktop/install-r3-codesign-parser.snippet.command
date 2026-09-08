# Canonical R3 replacement for R2 desktop/install.command helper.
codesign_requirement(){ [ -d "$1" ] || return 0; /usr/bin/codesign -d -r- "$1" 2>&1 | /usr/bin/sed -n 's/^[[:space:]]*designated[[:space:]]*=>[[:space:]]*//p' | /usr/bin/head -n1 || true; }
