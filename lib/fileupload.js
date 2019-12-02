const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const moment = require('moment');
const config = require('../config/config');

const s3 = new aws.S3({
  accessKeyId: config.s3.accessKeyId,
  secretAccessKey: config.s3.secretAccessKey,
  region: config.s3.region
});

// const storage = multer.diskStorage({
//   destination: function(req, file, cb) {
//     cb(null, config.file.uploadPath);
//   },
//   filename: function(req, file, cb) {
//     cb(null, moment().format('YYYYMMDDHHmmss') + "_" + file.originalname);
//   }
// });

const storage = multerS3({
  s3: s3,
  bucket: config.s3.bucketName,
  acl: 'public-read',
  metadata: function(req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function(req, file, cb) {
    cb(null, moment().format('YYYYMMDDHHmmss') + '_' + file.originalname);
  }
});
const upload = multer({ storage: storage }).single('file');

module.exports = upload;
