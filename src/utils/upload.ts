import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
    endpoint: 'https://fra1.digitaloceanspaces.com', 
    region: 'us-east-1', 
    credentials: {
      accessKeyId: 'DO006YMQMQP7U67BZKBD', 
      secretAccessKey: 'eNCo+guIAKiVNik8nGYtQSTz+H9ElUmLdN9x4jcVCfM', 
    },
  });
  
  
  export const Storage_Params = {
    Bucket: 'sportycredit',
    Key: '', 
    Body: '', 
    ACL: 'public-read',
  };
  

  export const uploadObject = async (obj) => {
    try {
      const data = await s3Client.send(new PutObjectCommand(obj));
      return data;
    } catch (err) {
      return err;
    }
  };