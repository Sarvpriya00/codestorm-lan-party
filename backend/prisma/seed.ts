import { PrismaClient, Difficulty, ContestStatus, ParticipantStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // Clean up database in specific order to avoid constraint violations
  console.log('Deleting existing data...');
  await prisma.review.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.contestProblem.deleteMany();
  await prisma.contestUser.deleteMany();
  await prisma.analytics.deleteMany();
  await prisma.leaderboard.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.systemControl.deleteMany();
  await prisma.questionProblem.deleteMany();
  await prisma.contest.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  try {
    await prisma.backupRecord.deleteMany();
  } catch (e) {
    // Ignore if backupRecord table does not exist
  }
  console.log('Finished deleting data.');

  // Create Permissions
  console.log('Creating permissions...');
  const permsToCreate = [
    { code: 100, name: 'Dashboard', description: 'Access to the main dashboard' },
    { code: 200, name: 'Problems', description: 'Access to problems list' },
    { code: 300, name: 'Judge Queue', description: 'Access to submission judging queue' },
    { code: 500, name: 'Users', description: 'Manage users' },
    { code: 600, name: 'Analytics', description: 'View system analytics' },
    { code: 700, name: 'Exports', description: 'Export data' },
    { code: 800, name: 'Contest Control', description: 'Control contest settings' },
    { code: 900, name: 'Audit Log', description: 'View audit logs' },
    { code: 1000, name: 'Backup', description: 'Manage system backups' },
    { code: 1100, name: 'Attendance', description: 'Manage attendance' },
  ];
  await prisma.permission.createMany({ data: permsToCreate });

  const parentPerms = await prisma.permission.findMany();
  const parentPermMap = new Map(parentPerms.map(p => [p.code, p.id]));

  const childPermsToCreate = [
    { code: 210, name: 'View Question', parentCode: 200, description: 'View a single question' },
    { code: 220, name: 'Add Submission', parentCode: 200, description: 'Submit a solution' },
    { code: 230, name: 'Total Score', parentCode: 200, description: 'View total score' },
    { code: 310, name: 'View Submission', parentCode: 300, description: 'View a submission for judging' },
    { code: 320, name: 'View Queue List', parentCode: 300, description: 'View list of submissions in queue' },
  ];

  for (const p of childPermsToCreate) {
    await prisma.permission.create({
      data: {
        code: p.code,
        name: p.name,
        description: p.description,
        parentPermissionId: parentPermMap.get(p.parentCode!)
      }
    });
  }
  console.log('Finished creating permissions.');

  const allPerms = await prisma.permission.findMany();
  const permIdMap = new Map(allPerms.map(p => [p.code, p.id]));

  // Create Roles
  console.log('Creating roles...');
  const adminRole = await prisma.role.create({ data: { name: 'ADMIN', description: 'Administrator' } });
  const judgeRole = await prisma.role.create({ data: { name: 'JUDGE', description: 'Judge' } });
  const participantRole = await prisma.role.create({ data: { name: 'PARTICIPANT', description: 'Participant' } });
  console.log('Finished creating roles.');

  // Assign Permissions to Roles
  console.log('Assigning permissions to roles...');
  const adminCodes = [100, 500, 600, 700, 800, 900, 1000, 1100, 200, 210, 220, 230, 300, 310, 320];
  const judgeCodes = [300, 310, 320, 200, 210];
  const participantCodes = [200, 210, 220, 230];

  await prisma.rolePermission.createMany({ data: adminCodes.map(code => ({ roleId: adminRole.id, permissionId: permIdMap.get(code)! })) });
  await prisma.rolePermission.createMany({ data: judgeCodes.map(code => ({ roleId: judgeRole.id, permissionId: permIdMap.get(code)! })) });
  await prisma.rolePermission.createMany({ data: participantCodes.map(code => ({ roleId: participantRole.id, permissionId: permIdMap.get(code)! })) });
  console.log('Finished assigning permissions.');

  // Create Users
  console.log('Creating users...');
  const hash = (s: string) => bcrypt.hashSync(s, 10);
  const [adminPwd, judgePwd, userPwd] = [hash('Admin@123'), hash('Judge@123'), hash('User@123')];

  await prisma.user.createMany({
    data: [
      { username: 'admin', displayName: 'Admin', password: adminPwd, roleId: adminRole.id },
      { username: 'judge1', displayName: 'Judge One', password: judgePwd, roleId: judgeRole.id },
      { username: 'judge2', displayName: 'Judge Two', password: judgePwd, roleId: judgeRole.id },
      { username: 'p1', displayName: 'Participant 1', password: userPwd, roleId: participantRole.id },
      { username: 'p2', displayName: 'Participant 2', password: userPwd, roleId: participantRole.id },
      { username: 'p3', displayName: 'Participant 3', password: userPwd, roleId: participantRole.id },
      { username: 'p4', displayName: 'Participant 4', password: userPwd, roleId: participantRole.id },
      { username: 'p5', displayName: 'Participant 5', password: userPwd, roleId: participantRole.id },
    ],
  });
  const admin = await prisma.user.findUniqueOrThrow({ where: { username: 'admin' } });
  console.log('Finished creating users.');

  // Create Problems
  console.log('Creating problems...');
  const problemsToCreate: { questionText: string; difficultyLevel: Difficulty; tags: string; createdById: string; maxScore: number; isActive: boolean; }[] = [];
  for (let i = 1; i <= 20; i++) problemsToCreate.push({ questionText: `[EASY] Problem #${i}`, difficultyLevel: 'EASY', tags: JSON.stringify(['easy', 'algorithms']), createdById: admin.id, maxScore: 100, isActive: true });
  for (let i = 1; i <= 20; i++) problemsToCreate.push({ questionText: `[MEDIUM] Problem #${i}`, difficultyLevel: 'MEDIUM', tags: JSON.stringify(['medium', 'data-structures']), createdById: admin.id, maxScore: 200, isActive: true });
  for (let i = 1; i <= 20; i++) problemsToCreate.push({ questionText: `[HARD] Problem #${i}`, difficultyLevel: 'HARD', tags: JSON.stringify(['hard', 'dynamic-programming']), createdById: admin.id, maxScore: 300, isActive: true });
  await prisma.questionProblem.createMany({ data: problemsToCreate });
  console.log('Finished creating problems.');

  // Create Contest and associate problems/users
  console.log('Creating contest...');
  const contest = await prisma.contest.create({
    data: { name: 'CodeStorm Test Contest', description: 'Seeded test contest', startTime: new Date(), endTime: new Date(Date.now() + 3 * 3600_000), status: 'RUNNING' },
  });
  const allProblems = await prisma.questionProblem.findMany({ orderBy: [{ difficultyLevel: 'asc' }, { id: 'asc' }] });
  await prisma.contestProblem.createMany({
    data: allProblems.map((p, idx) => ({ contestId: contest.id, problemId: p.id, order: idx + 1, points: p.maxScore }))
  });
  const participants = await prisma.user.findMany({ where: { roleId: participantRole.id } });
  await prisma.contestUser.createMany({
    data: participants.map(u => ({ contestId: contest.id, userId: u.id, joinedAt: new Date(), status: 'ACTIVE' }))
  });
  console.log('Finished creating contest.');

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });