package uploader.service;

import io.minio.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
@RequiredArgsConstructor
public class MinioService {

    @Value("${finpasser.storage.bucket-name}")
    private String bucketName;

    @Value("${finpasser.storage.endpoint}")
    private String endpoint;

    @Value("${finpasser.storage.access-key}")
    private String accessKey;

    @Value("${finpasser.storage.secret-key}")
    private String secretKey;

    private MinioClient minioClient;

    @PostConstruct
    public void initClient() {
        this.minioClient = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();

        ensureBucket();
    }

    private void ensureBucket() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucketName).build()
            );
            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(bucketName).build()
                );
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize MinIO bucket", e);
        }
    }

    public String upload(String objectName, InputStream stream, long size) {
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(stream, size, -1)
                            .build()
            );
            return objectName; // you can prepend endpoint/bucket if you want full URL
        } catch (Exception e) {
            throw new RuntimeException("MinIO upload failed", e);
        }
    }
}
