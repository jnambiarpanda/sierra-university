# Copyright Sierra

# Important targets should be documented with a ## immediately above their
# definition with a short string to be shown by `make help`. Targets only
# intended for internal use or by scripts should not documented as such to keep
# the online help short and accessible.

.PHONY: setup all

all: setup

## Install all required tools for local development
setup:
	@./setup


.PHONY: help
## Display online help for commonly used targets in this Makefile
help:
	@awk '/^[a-zA-Z_\/\.0-9-]+:/ {        \
		nb = sub( /^## /, "", helpMsg );  \
		if (nb)                           \
			print  $$1 "\t" helpMsg;      \
	}                                     \
	{ helpMsg = $$0 }' $(MAKEFILE_LIST) | \
	column -ts $$'\t' |                   \
	expand -t 1 |                         \
	grep --color '^[^ ]*'
