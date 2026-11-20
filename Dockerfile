# Image légère de nginx pour servir le site statique
FROM nginx:1.27-alpine

# Copie uniquement les fichiers du site
COPY index.html style.css script.js /usr/share/nginx/html/

EXPOSE 80
