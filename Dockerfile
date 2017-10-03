FROM node:8.4.0

RUN mkdir /echo

WORKDIR /echo/

ADD package.json /echo/package.json
ADD yarn.lock /echo/yarn.lock
RUN yarn global add node-gyp && yarn install --frozen-lockfile

ADD src /echo/src
ADD scripts /echo/scripts
ADD .eslintrc.js /echo/.eslintrc.js
ADD .eslintignore /echo/.eslintignore
