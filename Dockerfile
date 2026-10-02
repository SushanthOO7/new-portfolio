# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=24

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-slim as base

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Install required packages for workerd binary (needed in all stages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*


################################################################################
# Create a stage for installing production dependecies.
FROM base as deps

# Copy scripts directory needed for postinstall
COPY scripts ./scripts

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage bind mounts to package.json and package-lock.json to avoid having to copy them
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --legacy-peer-deps

################################################################################
# Create a stage for building the application.
FROM deps as build

# Download additional development dependencies before building, as some projects require
# "devDependencies" to be installed to build. If you don't need this, remove this step.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# Copy the rest of the source files into the image.
COPY . .
# Run the build script.
RUN npm run build

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
FROM base as final

# Use production node environment by default.
ENV NODE_ENV production

# Note: Running as root for Wrangler compatibility (needs temp directory access)
# USER node

# Copy package.json so that package manager commands can be used.
COPY package.json .

# Copy the full node_modules from the build stage (includes devDependencies needed for wrangler)
# and the built application from the build stage into the image.
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/build ./build

# Ensure workerd binary has execute permissions
RUN chmod +x ./node_modules/wrangler/node_modules/@cloudflare/workerd-linux-64/bin/workerd 2>/dev/null || true

# Ensure proper permissions for Wrangler temp directories
RUN mkdir -p /tmp && chmod 777 /tmp

# Install a simple HTTP server to serve the built files
RUN npm install -g serve

# Expose the port that the application listens on.
EXPOSE 7777

# Run the application using serve instead of wrangler pages dev
CMD ["serve", "-s", "build/client", "-l", "7777"]
