#!/bin/bash

# Create all backend modules and their base files

BACKEND_DIR="packages/backend/src"

# Array of modules
MODULES=("timeline" "generation" "validation" "export" "actions" "similarity" "notifications" "admin" "health")

for MODULE in "${MODULES[@]}"; do
  # Create module file
  cat > "$BACKEND_DIR/$MODULE/$MODULE.module.ts" << EOF
import { Module } from '@nestjs/common';
import { ${MODULE^}Service } from './${MODULE}.service';
import { ${MODULE^}Controller } from './${MODULE}.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [${MODULE^}Service],
  controllers: [${MODULE^}Controller],
  exports: [${MODULE^}Service],
})
export class ${MODULE^}Module {}
EOF

  # Create service file
  cat > "$BACKEND_DIR/$MODULE/$MODULE.service.ts" << EOF
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ${MODULE^}Service {
  constructor(private prisma: PrismaService) {}

  // TODO: Implement ${MODULE} service methods
}
EOF

  # Create controller file
  cat > "$BACKEND_DIR/$MODULE/$MODULE.controller.ts" << EOF
import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ${MODULE^}Service } from './${MODULE}.service';

@ApiTags('${MODULE}')
@Controller('api/v1/${MODULE}')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ${MODULE^}Controller {
  constructor(private ${MODULE}Service: ${MODULE^}Service) {}

  // TODO: Implement ${MODULE} endpoints
}
EOF

  echo "✓ Created $MODULE module"
done

echo "✓ All modules created successfully"
