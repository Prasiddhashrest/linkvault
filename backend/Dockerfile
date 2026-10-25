FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN mkdir -p /app/data
COPY --from=build /app/target/linkvault-backend-1.0.0.jar app.jar
EXPOSE 8080
ENV LINKVAULT_DATA_DIR=/app/data
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
