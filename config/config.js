const config = {
  mysql: {
    host     : 'hostname',
    user     : 'username',
    password : 'password',
    port     : 3306,
    database : 'rdbms',
    connectionLimit : 10
  },
  jwt: {
    secret : "secret",
    expire : "30m" // 30분
  },
  file: {
    rootPath : '/',
    uploadPath : 'uploads'
  },
  s3: {
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    region: 'ap-northeast-2',
    bucketName: 'bucketName'
  }
};

module.exports = config;