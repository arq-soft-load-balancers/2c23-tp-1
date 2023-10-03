#!/bin/sh

cd app
docker-compose down
docker-compose build
docker-compose up -d
