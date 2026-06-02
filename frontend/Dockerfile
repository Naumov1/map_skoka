FROM node:22-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_DGIS_MAPGL_KEY=""
ENV VITE_DGIS_MAPGL_KEY=$VITE_DGIS_MAPGL_KEY
RUN npm run build

FROM nginx:stable-alpine

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
