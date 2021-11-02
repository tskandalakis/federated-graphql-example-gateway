FROM node:16-alpine as builder

WORKDIR /usr/src/
COPY ./package.json ./
RUN apk --no-cache add --virtual native-deps \
  g++ gcc libgcc libstdc++ linux-headers make python && \
  npm install --quiet node-gyp -g &&\
  npm install --quiet && \
  apk del native-deps
COPY ./ ./
RUN npm run build

FROM node:16-alpine
COPY --from=builder /usr/src/dist /usr/src/app

ARG BUILD_DISPLAY_NAME
ENV BUILD_DISPLAY_NAME=$BUILD_DISPLAY_NAME

WORKDIR /usr/src/app
ENTRYPOINT [ "node", "index.js" ]
