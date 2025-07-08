FROM node:22.8.0-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

USER node

WORKDIR /home/node/app

CMD [ "tail", "-f", "/dev/null" ]
