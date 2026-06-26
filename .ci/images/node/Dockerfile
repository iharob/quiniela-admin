# Local CI runner image for the Vite/TS admin: Node 22 + git, plus ssh/rsync so
# the deploy steps can run when an SSH key is provided. Pinned & reproducible.
FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        git ca-certificates openssh-client rsync; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
CMD ["bash"]
