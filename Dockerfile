# Etapa 1: compilar Angular
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# Etapa 2: servir los archivos estáticos con nginx
FROM nginx:alpine
COPY --from=build /app/dist/frontend-campuslab/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]