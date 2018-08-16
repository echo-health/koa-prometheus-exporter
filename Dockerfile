FROM node:8.11.4

RUN mkdir /echo

WORKDIR /echo/

ADD package.json /echo/package.json
ADD package-lock.json /echo/package-lock.json
RUN npm install -g node-gyp && npm install

ADD src /echo/src
ADD scripts /echo/scripts
ADD .eslintrc.js /echo/.eslintrc.js
ADD .eslintignore /echo/.eslintignore
