import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ValidationPipe, Logger } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
    rawBody: false,
  });

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle("Incident Post-Mortem Generator API")
    .setDescription("Production-ready incident post-mortem generation system")
    .setVersion("1.0.0")
    .addBearerAuth()
    .addTag("auth", "Authentication endpoints")
    .addTag("incidents", "Incident management")
    .addTag("timeline", "Timeline reconstruction")
    .addTag("generation", "Post-mortem generation")
    .addTag("validation", "Quality gates")
    .addTag("export", "Document export")
    .addTag("actions", "Action item tracking")
    .addTag("analytics", "Similarity & pattern analysis")
    .addTag("admin", "Administration")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  const logger = new Logger("Bootstrap");
  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📚 API documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();
