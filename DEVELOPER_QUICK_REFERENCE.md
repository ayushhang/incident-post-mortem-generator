# Developer Quick Reference

## Key Commands

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev -w packages/backend   # Backend only
npm run dev -w packages/frontend  # Frontend only

# Building
npm run build            # Build all packages
npm run build -w packages/backend

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Database
npm run migrate          # Create migration
npm run migrate:deploy   # Apply migrations
npm run migrate:reset    # Reset database (dev only)
npm run seed             # Seed sample data

# Code Quality
npm run lint             # Lint all code
npm run format           # Format with Prettier
npm run type-check       # TypeScript check

# Docker
npm run docker:up        # Start services
npm run docker:down      # Stop services
npm run docker:build     # Build images

# Documentation
npm run docs             # Generate API docs (auto at localhost:3001/api/docs)
```

## File Locations Reference

### Backend API Endpoints
- Auth: `packages/backend/src/auth/auth.controller.ts`
- Incidents: `packages/backend/src/incidents/incidents.controller.ts`
- Timeline: `packages/backend/src/timeline/timeline.controller.ts`
- Generation: `packages/backend/src/generation/generation.controller.ts`

### Frontend Pages
- Dashboard: `packages/frontend/src/app/dashboard/page.tsx`
- Create Incident: `packages/frontend/src/app/incidents/new/page.tsx`
- Incident Detail: `packages/frontend/src/app/incidents/[id]/page.tsx`

### Database Schema
- Schema: `packages/backend/prisma/schema.prisma`
- Seed: `packages/backend/prisma/seed.ts`
- Migrations: `packages/backend/prisma/migrations/`

### Shared Types
- All DTOs: `packages/shared/src/index.ts`

### Configuration
- Environment: `.env.local` (copy from `.env.example`)
- Docker: `docker-compose.yml`
- CI/CD: `.github/workflows/ci.yml`

## Common Development Tasks

### Add New API Endpoint

1. **Define DTO** in `packages/shared/src/index.ts`:
```typescript
export interface CreateThingRequest {
  name: string;
}
```

2. **Create service method** in `packages/backend/src/thing/thing.service.ts`:
```typescript
async create(input: CreateThingRequest): Promise<ThingDto> {
  return this.prisma.thing.create({ data: input });
}
```

3. **Add controller endpoint** in `packages/backend/src/thing/thing.controller.ts`:
```typescript
@Post()
@ApiOperation({ summary: "Create thing" })
async create(@Body() input: CreateThingRequest) {
  return this.thingService.create(input);
}
```

4. **Test at** `http://localhost:3001/api/docs`

### Add Database Model

1. **Update schema** in `packages/backend/prisma/schema.prisma`
2. **Create migration**: `npm run migrate`
3. **Apply migration**: `npm run migrate:deploy`
4. **Update seed** in `packages/backend/prisma/seed.ts` if needed

### Debug Backend

```bash
# Add breakpoint in VS Code
# Press F5 or start debug session
# Run with npm run debug -w packages/backend
```

### Debug Frontend

```bash
# Open DevTools: F12
# Use Network, Console, Sources tabs
# React DevTools extension helpful
```

### View Database

```bash
# Connect to PostgreSQL
docker exec -it incident-postmortem-postgres psql -U postgres -d incident_postmortem

# Common queries
\dt                          # List tables
SELECT * FROM "User";        # Query users
\q                          # Quit
```

## Architecture Quick Map

```
User Request
    ↓
Frontend (Next.js)
    ↓ (API calls)
Backend API (NestJS)
    ↓
Services
    ├── Auth Service
    ├── Incident Service
    ├── Timeline Service
    ├── Generation Service
    └── ... (other services)
    ↓
Database (PostgreSQL)
    └── Cache (Redis)
    └── Files (S3/MinIO)
```

## Authentication Flow

```
Login → JWT Token → Bearer Token in Headers → JWT Validation → RBAC Check → Response
```

**Default User**:
- Email: `admin@incident-postmortem.com`
- Password: `password`

## Module Patterns

Every module follows this pattern:

```
module/
├── module.module.ts      # Module definition
├── module.service.ts     # Business logic
├── module.controller.ts  # HTTP endpoints
├── module.dto.ts         # Data transfer objects (if not in shared)
└── module.spec.ts        # Tests
```

## Testing Patterns

### Unit Test Example
```typescript
describe('MyService', () => {
  let service: MyService;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [MyService, ...mocks],
    }).compile();
    service = module.get<MyService>(MyService);
  });
  
  it('should do something', async () => {
    const result = await service.doSomething();
    expect(result).toBeDefined();
  });
});
```

### API Test Example
```bash
curl -X POST http://localhost:3001/api/v1/incidents \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
# Run tests: npm run test
# Format: npm run format

# Commit
git commit -m "feat: add new feature"

# Push
git push origin feature/your-feature

# Create pull request on GitHub
```

## Environment Variables Cheat Sheet

```
Development:
- NODE_ENV=development
- DATABASE_URL=postgresql://postgres:postgres@localhost:5432/...
- REDIS_URL=redis://localhost:6379

Production:
- NODE_ENV=production
- DATABASE_URL=<your-postgres-url>
- REDIS_URL=<your-redis-url>
- AUTH_SECRET=<random-32-char-string>
- LLM_PROVIDER=openai
- OPENAI_API_KEY=sk-...
```

## Troubleshooting

### Port already in use?
```bash
# Kill process on port 3000 or 3001
lsof -i :3000 | grep LISTEN
kill -9 <PID>
```

### Database connection error?
```bash
# Check if postgres is running
docker-compose ps

# View logs
docker logs incident-postmortem-postgres

# Restart
docker-compose restart postgres
```

### Dependencies issues?
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### TypeScript errors?
```bash
# Check for errors
npm run type-check

# Usually caused by type mismatches
# Fix by checking error line and matching types
```

## Performance Tips

1. **Use pagination** for large datasets
2. **Cache query results** in Redis
3. **Use indexes** on frequently searched fields
4. **Lazy load** components in frontend
5. **Compress API responses** with gzip
6. **Monitor query performance** with logs

## Security Checklist

- ✅ All inputs validated
- ✅ CORS properly configured
- ✅ JWT secrets kept in env vars
- ✅ Passwords hashed with bcrypt
- ✅ SQL injection prevented (Prisma ORM)
- ✅ XSS prevented (React escaping)
- ✅ HTTPS in production
- ✅ Rate limiting configured
- ✅ Audit logs enabled
- ✅ Secrets not in git

## Resources

- **NestJS Docs**: https://docs.nestjs.com
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **API Documentation**: http://localhost:3001/api/docs

## Getting Help

1. **Code examples**: Check `packages/backend/src/auth/` for patterns
2. **Architecture questions**: Read `ARCHITECTURE.md`
3. **Deployment questions**: Read `DEPLOYMENT.md`
4. **Setup issues**: Read `GETTING_STARTED.md`
5. **Database schema**: Check `packages/backend/prisma/schema.prisma`

## Performance Monitoring

```bash
# View application logs
npm run dev | grep "ERROR\|WARN\|timing"

# Database query logs
# Enable in Prisma: log: ['query', 'error', 'warn']

# Frontend Network tab in DevTools
# View API response times and sizes
```

---

**Keep this file bookmarked for quick reference!**

Happy coding! 🚀
