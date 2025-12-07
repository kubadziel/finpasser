package system;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import org.awaitility.Awaitility;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.postgresql.ds.PGSimpleDataSource;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import router.RouterApplication;
import uploader.UploaderApplication;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class EndToEndUploadSystemTest {

    private static final DockerImageName POSTGRES_IMAGE = DockerImageName.parse("postgres:16");
    private static final DockerImageName KAFKA_IMAGE = DockerImageName.parse("confluentinc/cp-kafka:7.5.1");
    private static final DockerImageName MINIO_IMAGE = DockerImageName.parse("minio/minio:RELEASE.2024-10-13T10-41-23Z");

    private static final int ROUTER_PORT = 18080;
    private static final int UPLOADER_PORT = 18081;
    private static final String TEST_BUCKET = "router-inbound";

    @Container
    private static final PostgreSQLContainer<?> uploaderDb = new PostgreSQLContainer<>(POSTGRES_IMAGE)
            .withDatabaseName("uploaderdb")
            .withUsername("uploader")
            .withPassword("uploader");

    @Container
    private static final PostgreSQLContainer<?> routerDb = new PostgreSQLContainer<>(POSTGRES_IMAGE)
            .withDatabaseName("routerdb")
            .withUsername("router")
            .withPassword("router");

    @Container
    private static final KafkaContainer kafka = new KafkaContainer(KAFKA_IMAGE);

    @Container
    private static final MinIOContainer minio = new MinIOContainer(MINIO_IMAGE);

    private ConfigurableApplicationContext routerApp;
    private ConfigurableApplicationContext uploaderApp;
    private final RestTemplate restTemplate = new RestTemplate();

    @BeforeAll
    void startInfrastructure() {
        uploaderDb.start();
        routerDb.start();
        kafka.start();
        minio.start();

        routerApp = startRouterApp();
        uploaderApp = startUploaderApp();
    }

    @AfterAll
    void shutdownInfrastructure() {
        if (uploaderApp != null) {
            uploaderApp.close();
        }
        if (routerApp != null) {
            routerApp.close();
        }
        minio.stop();
        kafka.stop();
        uploaderDb.stop();
        routerDb.stop();
    }

    @Test
    void fileUpload_reachesRouter_and_updatesStatus() throws Exception {
        String uploaderBaseUrl = "http://localhost:" + UPLOADER_PORT + "/api/upload";
        byte[] payload = Files.readAllBytes(Path.of("src/test/resources/test-files/sample_pain001.xml"));

        String contractId = "7654321";

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new NamedByteArrayResource(payload, contractId + "_sample_pain001.xml"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        var response = restTemplate.postForEntity(uploaderBaseUrl, request, Map.class);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("SENT_TO_ROUTER");

        JdbcTemplate routerJdbc = new JdbcTemplate(dataSourceFor(routerDb));

        Awaitility.await()
                .atMost(Duration.ofSeconds(30))
                .untilAsserted(() -> {
                    Integer count = routerJdbc.queryForObject("select count(*) from message_entity", Integer.class);
                    assertThat(count).isEqualTo(1);
                });

        Map<String, Object> routerRow = routerJdbc.queryForMap("select contract_id, status, blob_url from message_entity");
        assertThat(routerRow.get("contract_id")).isEqualTo(contractId);
        assertThat(routerRow.get("status")).isEqualTo("RECEIVED");

        Awaitility.await()
                .atMost(Duration.ofSeconds(30))
                .untilAsserted(() -> {
                    String status = uploaderJdbc.queryForObject("select status from message_entity", String.class);
                    assertThat(status).isEqualTo("DELIVERED");
                });

        MinioClient client = MinioClient.builder()
                .endpoint(minio.getS3URL())
                .credentials(minio.getUserName(), minio.getPassword())
                .build();

        String objectKey = (String) routerRow.get("blob_url");
        try (InputStream objectStream = client.getObject(
                GetObjectArgs.builder().bucket(TEST_BUCKET).object(objectKey).build());
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            objectStream.transferTo(baos);
            assertThat(baos.size()).isGreaterThan(0);
        }
    }

    private ConfigurableApplicationContext startRouterApp() {
        Map<String, Object> props = new HashMap<>();
        props.put("server.port", ROUTER_PORT);
        props.put("spring.datasource.url", routerDb.getJdbcUrl());
        props.put("spring.datasource.username", routerDb.getUsername());
        props.put("spring.datasource.password", routerDb.getPassword());
        props.put("spring.datasource.driver-class-name", routerDb.getDriverClassName());
        props.put("spring.jpa.hibernate.ddl-auto", "create-drop");
        props.put("spring.kafka.bootstrap-servers", kafka.getBootstrapServers());
        props.put("spring.kafka.consumer.auto-offset-reset", "earliest");
        props.put("spring.kafka.consumer.properties.spring.json.trusted.packages", "shared.events");
        props.put("security.enabled", "false");

        return new SpringApplicationBuilder(RouterApplication.class)
                .properties(props)
                .run();
    }

    private ConfigurableApplicationContext startUploaderApp() {
        Map<String, Object> props = new HashMap<>();
        props.put("server.port", UPLOADER_PORT);
        props.put("spring.datasource.url", uploaderDb.getJdbcUrl());
        props.put("spring.datasource.username", uploaderDb.getUsername());
        props.put("spring.datasource.password", uploaderDb.getPassword());
        props.put("spring.datasource.driver-class-name", uploaderDb.getDriverClassName());
        props.put("spring.jpa.hibernate.ddl-auto", "create-drop");
        props.put("spring.kafka.bootstrap-servers", kafka.getBootstrapServers());
        props.put("spring.kafka.consumer.auto-offset-reset", "earliest");
        props.put("spring.kafka.consumer.properties.spring.json.trusted.packages", "shared.events");
        props.put("finpasser.storage.endpoint", minio.getS3URL());
        props.put("finpasser.storage.access-key", minio.getUserName());
        props.put("finpasser.storage.secret-key", minio.getPassword());
        props.put("finpasser.storage.bucket-name", TEST_BUCKET);
        props.put("security.enabled", "false");
        props.put("keycloak.validation.enabled", "false");

        return new SpringApplicationBuilder(UploaderApplication.class)
                .properties(props)
                .run();
    }

    private static javax.sql.DataSource dataSourceFor(PostgreSQLContainer<?> container) {
        PGSimpleDataSource dataSource = new PGSimpleDataSource();
        dataSource.setURL(container.getJdbcUrl());
        dataSource.setUser(container.getUsername());
        dataSource.setPassword(container.getPassword());
        return dataSource;
    }

    private static class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;

        NamedByteArrayResource(byte[] byteArray, String filename) {
            super(byteArray);
            this.filename = filename;
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
