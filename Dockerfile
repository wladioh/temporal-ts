
ARG SONAR_URL=http://localhost:9000
ARG SONAR_LOGIN
#
# ---- Base Node ----
FROM node:14-alpine AS base
RUN npm install pm2 -g
WORKDIR /app
COPY package.json ./
COPY yarn.lock ./
RUN npm cache clean --force

#
# ---- Tests ----
FROM base AS tests
RUN npm set progress=false && npm config set depth 0
RUN yarn --frozen-lockfile 
COPY ./src ./src
COPY ./tests ./tests
COPY tsconfig.json ./
COPY jest.config.ts ./
COPY tsoa.json ./
RUN yarn test

#
# ---- Sonar ----
FROM sonarsource/sonar-scanner-cli:4 AS sonar
ARG SONAR_URL
ARG SONAR_LOGIN
ENV SONAR_URL ${SONAR_URL}
ENV SONAR_LOGIN ${SONAR_LOGIN}
COPY ./src ./src
COPY ./sonar-project.properties ./
COPY --from=tests /app/coverage ./coverage
COPY --from=tests /app/test-report.xml ./
RUN sonar-scanner 

#
# ---- scratch tests results ----
FROM scratch as export-test-results
COPY --from=tests /app/coverage ./coverage
COPY --from=tests /app/test-report.xml ./

#
# ---- build ----
FROM tests AS build
RUN yarn build
RUN yarn --production

#
# ---- Release ----
FROM base AS release
COPY --from=build /app/node_modules ./node_modules
RUN true
COPY --from=build /app/dist .
RUN true
# expose port and define CMD
EXPOSE 8080 8081
USER node
CMD pm2-runtime ./index.js