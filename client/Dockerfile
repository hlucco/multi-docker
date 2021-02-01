#Build phase
FROM node:alpine

WORKDIR '/app'

COPY package.json .

RUN npm install

COPY . .

RUN npm run build

#Run phase
#second from statement means previous block complete

FROM nginx

#port exposure for elastic beanstalk
EXPOSE 3000

COPY ./nginx/default.conf /etc/nginx/conf.d/deafult.conf

#copying build result over to new phase
COPY --from=0 /app/build /usr/share/nginx/html

#default command of nginx auto starts it

