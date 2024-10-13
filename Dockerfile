# PHP base image used as it provides web app and API functionality
FROM php:apache

# Setting working directory
WORKDIR /var/www/html

# Install necessary dependencies and use a specific version of zlib
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    libzip-dev \
    && rm -rf /var/lib/apt/lists/* \
    && docker-php-ext-install zip

# Copying application files
COPY app/ ./

EXPOSE 80

