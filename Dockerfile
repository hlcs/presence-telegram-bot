FROM denoland/deno:ubuntu-1.29.1

WORKDIR /app
COPY index.ts .
COPY src ./src
RUN mkdir db
RUN deno cache index.ts
CMD ["deno","run", "--allow-net", "--allow-read", "--allow-env", "--allow-write","index.ts"]
