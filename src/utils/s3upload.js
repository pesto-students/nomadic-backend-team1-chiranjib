const { S3 } = require('aws-sdk');
const uuid = require('uuid').v4;

s3Upload = async (files) => {
  const s3 = new S3();
  const params = files.map((file) => {
    return {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `propertyimages/${uuid()}-${file.originalname}`,
      Body: file.buffer,
    };
  });

  return await Promise.all(params.map((param) => s3.upload(param).promise()));
};

module.exports = s3Upload;