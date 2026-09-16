FROM node:20-bookworm

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium curl python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt
RUN python3 -m pip install --break-system-packages --no-cache-dir -r /app/backend/requirements.txt

COPY frontend/package.json frontend/package-lock.json /app/frontend/
RUN npm --prefix /app/frontend ci

COPY backend /app/backend
COPY frontend /app/frontend
COPY tests/browser /app/tests/browser
COPY tests/browser/run-e2e.sh /usr/local/bin/run-e2e

RUN chmod +x /usr/local/bin/run-e2e

CMD ["run-e2e"]
