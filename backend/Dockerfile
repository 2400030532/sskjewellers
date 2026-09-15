FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "target/showroom-api-0.0.1-SNAPSHOT.jar"]
