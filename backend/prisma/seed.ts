import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create Roles
  console.log('Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      id: 'admin-role-id',
      name: 'ADMIN',
      description: 'Administrator role with full system access',
    },
  });

  const judgeRole = await prisma.role.upsert({
    where: { name: 'JUDGE' },
    update: {},
    create: {
      id: 'judge-role-id',
      name: 'JUDGE',
      description: 'Judge role for reviewing and scoring submissions',
    },
  });

  const participantRole = await prisma.role.upsert({
    where: { name: 'PARTICIPANT' },
    update: {},
    create: {
      id: 'participant-role-id',
      name: 'PARTICIPANT',
      description: 'Participant role for solving problems and submitting solutions',
    },
  });

  // 2. Create Permissions
  console.log('Creating permissions...');
  const permissions: Array<{code: number, name: string, description: string, parentCode?: number}> = [
    // Admin permissions
    { code: 100, name: 'Dashboard', description: 'Access to admin dashboard' },
    { code: 500, name: 'Users', description: 'User management access' },
    { code: 600, name: 'Analytics', description: 'Analytics and reporting access' },
    { code: 700, name: 'Exports', description: 'Data export functionality' },
    { code: 800, name: 'Contest Control', description: 'Contest management and control' },
    { code: 810, name: 'Timer Control', description: 'Contest timer management', parentCode: 800 },
    { code: 820, name: 'Phase Control', description: 'Contest phase management', parentCode: 800 },
    { code: 830, name: 'Display Control', description: 'Contest display management', parentCode: 800 },
    { code: 840, name: 'Emergency Actions', description: 'Emergency contest actions', parentCode: 800 },
    { code: 850, name: 'Problem Control', description: 'Problem management in contests', parentCode: 800 },
    { code: 860, name: 'User Control', description: 'User management in contests', parentCode: 800 },
    { code: 900, name: 'Audit Log', description: 'Audit log access' },
    { code: 1000, name: 'Backup', description: 'System backup and restore' },
    { code: 1100, name: 'Attendance', description: 'Attendance tracking' },
    
    // Judge permissions
    { code: 300, name: 'Judge Queue', description: 'Judge queue access' },
    { code: 310, name: 'View Submission', description: 'View submission details', parentCode: 300 },
    { code: 320, name: 'View Queue List', description: 'View judge queue list', parentCode: 300 },
    
    // Participant permissions
    { code: 200, name: 'Problems', description: 'Problem access' },
    { code: 210, name: 'View Question', description: 'View problem questions', parentCode: 200 },
    { code: 220, name: 'Add Submission', description: 'Submit solutions', parentCode: 200 },
    { code: 230, name: 'Total Score', description: 'View total score', parentCode: 200 },
  ];

  const createdPermissions = new Map();
  
  // First pass: create permissions without parent relationships
  for (const perm of permissions) {
    const permission = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: {
        code: perm.code,
        name: perm.name,
        description: perm.description,
      },
    });
    createdPermissions.set(perm.code, permission);
  }

  // Second pass: update parent relationships
  for (const perm of permissions) {
    if (perm.parentCode) {
      const parentPermission = createdPermissions.get(perm.parentCode);
      if (parentPermission) {
        await prisma.permission.update({
          where: { code: perm.code },
          data: {
            parentPermissionId: parentPermission.id,
          },
        });
      }
    }
  }

  // 3. Create Role-Permission mappings
  console.log('Creating role-permission mappings...');
  
  // Admin permissions
  const adminPermissions = [100, 500, 600, 700, 800, 810, 820, 830, 840, 850, 860, 900, 1000, 1100];
  for (const permCode of adminPermissions) {
    const permission = createdPermissions.get(permCode);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
          inherited: false,
        },
      });
    }
  }

  // Judge permissions
  const judgePermissions = [300, 310, 320];
  for (const permCode of judgePermissions) {
    const permission = createdPermissions.get(permCode);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: judgeRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: judgeRole.id,
          permissionId: permission.id,
          inherited: false,
        },
      });
    }
  }

  // Participant permissions
  const participantPermissions = [200, 210, 220, 230];
  for (const permCode of participantPermissions) {
    const permission = createdPermissions.get(permCode);
    if (permission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: participantRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: participantRole.id,
          permissionId: permission.id,
          inherited: false,
        },
      });
    }
  }

  // 4. Create dummy users with new role system
  console.log('Creating users...');
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordJudge = await bcrypt.hash('judge123', 10);
  const hashedPasswordParticipant = await bcrypt.hash('participant123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      roleId: adminRole.id,
      displayName: 'System Administrator',
    },
    create: {
      username: 'admin',
      displayName: 'System Administrator',
      password: hashedPasswordAdmin,
      roleId: adminRole.id,
    },
  });

  const judge = await prisma.user.upsert({
    where: { username: 'judge' },
    update: {
      roleId: judgeRole.id,
      displayName: 'Contest Judge',
    },
    create: {
      username: 'judge',
      displayName: 'Contest Judge',
      password: hashedPasswordJudge,
      roleId: judgeRole.id,
    },
  });

  const participant = await prisma.user.upsert({
    where: { username: 'participant' },
    update: {
      roleId: participantRole.id,
      displayName: 'Contest Participant',
    },
    create: {
      username: 'participant',
      displayName: 'Contest Participant',
      password: hashedPasswordParticipant,
      roleId: participantRole.id,
    },
  });

  console.log('Users created/updated.');

  // 5. Create a default contest
  console.log('Creating default contest...');
  const defaultContest = await prisma.contest.upsert({
    where: { id: 'default-contest-id' },
    update: {},
    create: {
      id: 'default-contest-id',
      name: 'CodeStorm Practice Contest',
      description: 'Default practice contest for testing and development',
      status: 'PLANNED',
    },
  });

  // 6. Seed problems from easy.json and convert to QuestionProblem format
  console.log('Seeding problems...');
  const problemsDataPath = path.join(__dirname, '../../easy.json');
  
  if (fs.existsSync(problemsDataPath)) {
    const problemsData = JSON.parse(fs.readFileSync(problemsDataPath, 'utf-8'));

    const easyProblems = problemsData.easy_problems?.map((p: any) => ({
      questionText: `${p.title}\n\n${p.description}`,
      difficultyLevel: 'EASY',
      maxScore: 0.5,
      tags: 'easy,basic',
      createdById: admin.id,
    })) || [];

    const forLoopProblems = problemsData.for_loop_problems?.map((p: any) => ({
      questionText: `${p.title}\n\n${p.description}`,
      difficultyLevel: 'MEDIUM',
      maxScore: 1.0,
      tags: 'medium,loops',
      createdById: admin.id,
    })) || [];

    const problemSolvingChallenges = problemsData.problem_solving_challenges?.map((p: any) => ({
      questionText: `${p.title}\n\n${p.description}`,
      difficultyLevel: 'HARD',
      maxScore: 5.0,
      tags: 'hard,challenge',
      createdById: admin.id,
    })) || [];

    const allProblems = [...easyProblems, ...forLoopProblems, ...problemSolvingChallenges];

    for (let i = 0; i < allProblems.length; i++) {
      const problem = allProblems[i];
      const createdProblem = await prisma.questionProblem.create({
        data: problem,
      });

      // Add problem to default contest
      await prisma.contestProblem.create({
        data: {
          contestId: defaultContest.id,
          problemId: createdProblem.id,
          order: i + 1,
          points: problem.maxScore,
        },
      });
    }

    console.log(`${allProblems.length} problems seeded and added to default contest.`);
  } else {
    console.log('easy.json not found, skipping problem seeding.');
  }

  // 7. Create initial analytics entry
  console.log('Creating initial analytics...');
  const existingAnalytics = await prisma.analytics.findFirst({
    where: { contestId: defaultContest.id },
  });
  
  if (!existingAnalytics) {
    await prisma.analytics.create({
      data: {
        contestId: defaultContest.id,
        totalSubmissions: 0,
        correctSubmissions: 0,
        activeParticipants: 0,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });