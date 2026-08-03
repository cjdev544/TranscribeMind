#!/bin/sh
# Runs automatically on LocalStack startup (mounted into /etc/localstack/init/ready.d/)
# to make sure the bucket the gateway/worker expect already exists.
awslocal s3api create-bucket --bucket "${S3_BUCKET:-transcribemind-videos}"
