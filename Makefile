ARGS ?= ""

.PHONY: build test default coverage

default: .git/hooks/pre-commit build

build:
	docker-compose build
	npm install

.git/hooks/pre-commit: scripts/prettier.sh
	cp scripts/prettier.sh .git/hooks/pre-commit

run:
	docker-compose up

test:
	docker-compose run --rm -e DEBUG='' koa-prometheus-exporter npm test -- $(ARGS)

lint:
	docker-compose run --rm koa-prometheus-exporter yarn lint

format:
	docker-compose run --rm koa-prometheus-exporter yarn format

shell:
	docker-compose run --rm koa-prometheus-exporter bash

coverage:
	open coverage/lcov-report/index.html