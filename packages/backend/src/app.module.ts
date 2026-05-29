import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./common/prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { IncidentsModule } from "./incidents/incidents.module";
import { TimelineModule } from "./timeline/timeline.module";
import { GenerationModule } from "./generation/generation.module";
import { ValidationModule } from "./validation/validation.module";
import { ExportModule } from "./export/export.module";
import { ActionsModule } from "./actions/actions.module";
import { SimilarityModule } from "./similarity/similarity.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { AdminModule } from "./admin/admin.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    PrismaModule,
    AuthModule,
    IncidentsModule,
    TimelineModule,
    GenerationModule,
    ValidationModule,
    ExportModule,
    ActionsModule,
    SimilarityModule,
    NotificationsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
