# ==========================================
# Stage 1: Build Stage
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies using package lock for reproducibility
COPY package*.json ./
RUN npm ci

# Copy code and compile the production build
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Production Stage
# ==========================================
FROM nginx:stable-alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Support non-root execution by creating and modifying permissions on Nginx workspace paths
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    chown -R nginx:nginx /usr/share/nginx/html

# Run as non-privileged user (101:nginx is standard in alpine-nginx images)
USER nginx

# Port 8080 is used as non-root cannot bind to port 80
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
