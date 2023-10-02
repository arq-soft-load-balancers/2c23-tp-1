#!/bin/sh

cd app
docker-compose down
docker-compsoe build
docker-compose up -d
