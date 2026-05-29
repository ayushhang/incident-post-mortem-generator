"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("🌱 Seeding database...");
    // Create sample incidents
    await prisma.incident.create({
        data: {
            title: "API Service Outage - Database Connection Pool Exhaustion",
            description: "Production API became unresponsive due to database connection pool exhaustion during traffic spike.",
            severity: client_1.IncidentSeverity.CRITICAL,
            status: client_1.IncidentStatus.FINALIZED,
            serviceAffected: "API Service",
            environment: "production",
            startTime: new Date("2024-05-20T14:30:00Z"),
            endTime: new Date("2024-05-20T16:15:00Z"),
            isOngoing: false,
            usersAffected: 50000,
            revenueImpact: 125000,
            regionsAffected: "US-East, EU-West",
            internalTeams: "Platform,Backend,Database",
            slaTarget: 60,
            createdBy: "admin",
            timeline: "Database connection issue identified",
        },
    });
    await prisma.incident.create({
        data: {
            title: "Memory Leak in Cache Layer",
            description: "Memory usage on cache servers increased gradually until OOMKiller triggered.",
            severity: client_1.IncidentSeverity.HIGH,
            status: client_1.IncidentStatus.FINALIZED,
            serviceAffected: "Cache Layer",
            environment: "production",
            startTime: new Date("2024-05-19T10:00:00Z"),
            endTime: new Date("2024-05-19T12:30:00Z"),
            isOngoing: false,
            usersAffected: 10000,
            revenueImpact: 25000,
            regionsAffected: "US-East",
            internalTeams: "Backend,Infrastructure",
            slaTarget: 120,
            createdBy: "admin",
        },
    });
    // Create sample user
    const user = await prisma.user.findUnique({
        where: { email: "admin@incident-postmortem.com" },
    });
    if (!user) {
        const hashedPassword = await bcrypt.hash("ChangeMe123!", 10);
        await prisma.user.create({
            data: {
                email: "admin@incident-postmortem.com",
                name: "Admin User",
                password: hashedPassword,
                role: "ADMIN",
                isActive: true,
            },
        });
        console.log("✓ Created admin user");
    }
    // Create SLA configurations
    await prisma.sLAConfiguration.deleteMany();
    await prisma.sLAConfiguration.createMany({
        data: [
            {
                severity: client_1.IncidentSeverity.CRITICAL,
                targetMTTD: 15, // 15 minutes to detect
                targetMTTE: 10, // 10 minutes to escalate
                targetMTTR: 60, // 1 hour to resolve
            },
            {
                severity: client_1.IncidentSeverity.HIGH,
                targetMTTD: 30,
                targetMTTE: 20,
                targetMTTR: 120,
            },
            {
                severity: client_1.IncidentSeverity.MEDIUM,
                targetMTTD: 60,
                targetMTTE: 30,
                targetMTTR: 240,
            },
            {
                severity: client_1.IncidentSeverity.LOW,
                targetMTTD: 120,
                targetMTTE: 60,
                targetMTTR: 480,
            },
        ],
    });
    console.log("✓ Created SLA configurations");
    // Create sample incident packages
    await prisma.sampleIncidentPackage.create({
        data: {
            name: "API Outage Example",
            description: "Example incident with timeline, logs, and alert history",
            timelineNotes: `14:30 - Alert triggered for high latency on API endpoints
14:32 - On-call engineer acknowledges alert
14:35 - Investigation begins, database queries appear slow
14:40 - Connection pool exhaustion identified in metrics
14:45 - Database team notified, begin remediation
14:50 - Connection pool limits increased and service restarted
15:00 - Service recovery confirmed, metrics normalizing
16:00 - RCA investigation begins`,
            logs: `[14:30:45] ERROR: db.query timeout after 30000ms
[14:31:12] WARN: Connection pool usage at 95%
[14:31:45] ERROR: Cannot acquire connection, pool exhausted
[14:50:23] INFO: Service restarted successfully
[14:51:00] INFO: Connection pool initialized with 100 connections`,
            slackExport: `{"messages":[
{"type":"message","user":"U123","text":"API latency spike detected","ts":"1234567890.000001"},
{"type":"message","user":"U456","text":"Investigating database connections","ts":"1234567890.000002"},
{"type":"message","user":"U789","text":"Found connection pool exhaustion, restarting service","ts":"1234567890.000003"}
]}`,
            alertHistory: `Alert: HighLatency - Severity: High - Time: 14:30 UTC
Alert: DBConnectionFailure - Severity: Critical - Time: 14:32 UTC
Alert: ServiceRecovery - Severity: Info - Time: 15:00 UTC`,
        },
    });
    console.log("✓ Created sample incident packages");
    console.log("✅ Database seeding completed!");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => {
    void prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map