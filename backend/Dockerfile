FROM python:3.12.7

RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir /app

WORKDIR /app

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY . .

RUN chmod a+x docker/*.sh
