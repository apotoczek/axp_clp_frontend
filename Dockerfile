FROM ubuntu:16.04

RUN apt-get update && apt-get -y install curl gnupg python-pip build-essential git \
    chromium-browser jq unzip
RUN curl -sL https://deb.nodesource.com/setup_12.x  | bash -
RUN apt-get -y install nodejs

RUN pip install --ignore-installed --upgrade pip
RUN pip install --upgrade setuptools

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

# Install backup script
RUN pip install git+https://github.com/bisondev/s3backup.git
