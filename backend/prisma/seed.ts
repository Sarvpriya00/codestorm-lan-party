import { PrismaClient, ContestStatus, Difficulty } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Define Permissions
  const permissionsData = [
    { code: 100, name: 'Dashboard', description: 'Access to dashboard', parentCode: null },
    { code: 200, name: 'Problems', description: 'Access to problems', parentCode: null },
    { code: 210, name: 'View Question', description: 'View question details', parentCode: 200 },
    { code: 220, name: 'Add Submission', description: 'Submit solutions', parentCode: 200 },
    { code: 230, name: 'Total Score', description: 'View total score', parentCode: 200 },
    { code: 300, name: 'Judge Queue', description: 'Access to judge queue', parentCode: null },
    { code: 310, name: 'View Submission', description: 'View submissions for judging', parentCode: 300 },
    { code: 320, name: 'View Queue List', description: 'View judge queue list', parentCode: 300 },
    { code: 500, name: 'Users', description: 'User management', parentCode: null },
    { code: 600, name: 'Analytics', description: 'Access to analytics', parentCode: null },
    { code: 700, name: 'Exports', description: 'Data export capabilities', parentCode: null },
    { code: 800, name: 'Contest Control', description: 'Contest management', parentCode: null },
    { code: 810, name: 'Timer Control', description: 'Contest timer control', parentCode: 800 },
    { code: 820, name: 'Phase Control', description: 'Contest phase control', parentCode: 800 },
    { code: 830, name: 'Display Control', description: 'Contest display control', parentCode: 800 },
    { code: 840, name: 'Emergency Actions', description: 'Emergency contest actions', parentCode: 800 },
    { code: 850, name: 'Problem Control', description: 'Contest problem management', parentCode: 800 },
    { code: 860, name: 'User Control', description: 'Contest user management', parentCode: 800 },
    { code: 900, name: 'Audit Log', description: 'Access to audit logs', parentCode: null },
    { code: 1000, name: 'Backup', description: 'System backup management', parentCode: null },
    { code: 1100, name: 'Attendance', description: 'Attendance tracking', parentCode: null },
  ];

  const createdPermissions = new Map<number, string>(); // Map code to ID

  // Create permissions without parent relationships first
  const rootPermissions = permissionsData.filter(p => p.parentCode === null);
  // Use a loop for create to handle potential duplicates if not a fresh reset
  for (const perm of rootPermissions) {
    const newPerm = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, description: perm.description },
      create: { code: perm.code, name: perm.name, description: perm.description },
    });
    createdPermissions.set(newPerm.code, newPerm.id);
    console.log(`Created/Updated root permission: ${newPerm.name} (${newPerm.code})`);
  }

  // Create permissions with parent relationships
  const childPermissions = permissionsData.filter(p => p.parentCode !== null);
  for (const perm of childPermissions) {
    const parentId = createdPermissions.get(perm.parentCode!);
    if (!parentId) {
      console.error(`Parent permission with code ${perm.parentCode} not found for ${perm.name}`);
      continue;
    }
    const newPerm = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        description: perm.description,
        parentPermission: { connect: { id: parentId } },
      },
      create: {
        code: perm.code,
        name: perm.name,
        description: perm.description,
        parentPermission: { connect: { id: parentId } },
      },
    });
    createdPermissions.set(newPerm.code, newPerm.id);
    console.log(`Created/Updated permission: ${newPerm.name} (${newPerm.code}) with parent ${perm.parentCode}`);
  }

  // 2. Create Roles
  const rolesToCreate = [
    { name: 'ADMIN', description: 'Administrator with full system access' },
    { name: 'JUDGE', description: 'Judge for reviewing submissions' },
    { name: 'PARTICIPANT', description: 'Contest participant' },
  ];
  // Use upsert for roles to handle re-running seed
  for (const roleData of rolesToCreate) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: roleData,
    });
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  const judgeRole = await prisma.role.findUniqueOrThrow({ where: { name: 'JUDGE' } });
  const participantRole = await prisma.role.findUniqueOrThrow({ where: { name: 'PARTICIPANT' } });
  console.log('Created/Updated roles: ADMIN, JUDGE, PARTICIPANT');

  // 3. Assign Permissions to Roles
  const assignPermissionsToRole = async (roleId: string, permissionCodes: number[]) => {
    const rolePermissionsData = permissionCodes.map(code => {
      const permissionId = createdPermissions.get(code);
      if (!permissionId) {
        console.warn(`Permission with code ${code} not found for role assignment.`);
        return null;
      }
      return { roleId, permissionId, inherited: false };
    }).filter(Boolean) as { roleId: string; permissionId: string; inherited: boolean }[];

    // Use a loop for upsert to handle re-running seed
    for (const rpData of rolePermissionsData) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: rpData.roleId, permissionId: rpData.permissionId } },
        update: { inherited: rpData.inherited },
        create: rpData,
      });
    }
  };

  // ADMIN permissions (all permissions)
  await assignPermissionsToRole(adminRole.id, permissionsData.map(p => p.code));
  console.log('Assigned all permissions to ADMIN role.');

  // JUDGE permissions (Judge Queue, View Submission, View Queue List)
  await assignPermissionsToRole(judgeRole.id, [300, 310, 320]);
  console.log('Assigned JUDGE permissions.');

  // PARTICIPANT permissions (Problems, View Question, Add Submission, Total Score)
  await assignPermissionsToRole(participantRole.id, [200, 210, 220, 230]);
  console.log('Assigned PARTICIPANT permissions.');

  // 4. Create Sample Users
  const hashedPasswordAdmin = await bcrypt.hash('adminpass', 10);
  const hashedPasswordJudge = await bcrypt.hash('judgepass', 10);
  const hashedPasswordParticipant = await bcrypt.hash('partpass', 10);

  const usersToCreate = [
    { username: 'adminuser', password: hashedPasswordAdmin, roleId: adminRole.id, displayName: 'Admin User' },
    { username: 'judgeuser1', password: hashedPasswordJudge, roleId: judgeRole.id, displayName: 'Judge User One' },
    { username: 'judgeuser2', password: hashedPasswordJudge, roleId: judgeRole.id, displayName: 'Judge User Two' },
    { username: 'participant1', password: hashedPasswordParticipant, roleId: participantRole.id, displayName: 'Participant One' },
    { username: 'participant2', password: hashedPasswordParticipant, roleId: participantRole.id, displayName: 'Participant Two' },
    { username: 'participant3', password: hashedPasswordParticipant, roleId: participantRole.id, displayName: 'Participant Three' },
    { username: 'participant4', password: hashedPasswordParticipant, roleId: participantRole.id, displayName: 'Participant Four' },
    { username: 'participant5', password: hashedPasswordParticipant, roleId: participantRole.id, displayName: 'Participant Five' },
  ];

  // Use upsert for users to handle re-running seed
  for (const userData of usersToCreate) {
    await prisma.user.upsert({
      where: { username: userData.username },
      update: { password: userData.password, roleId: userData.roleId, displayName: userData.displayName },
      create: userData,
    });
  }

  const adminUser = await prisma.user.findUniqueOrThrow({ where: { username: 'adminuser' } });
  const participantUsers = await prisma.user.findMany({
    where: { roleId: participantRole.id },
  });
  console.log('Created/Updated sample users.');

  // 5. Create 60 Sample Problems
  const problemsToCreate = [];
  const problemTitles = [
    "Reverse a String", "Find Max Element", "Check Palindrome", "Factorial Calculation", "Sum of Array",
    "FizzBuzz", "Count Vowels", "Remove Duplicates", "Merge Sorted Arrays", "Find Missing Number",
    "Prime Number Check", "Fibonacci Sequence", "Anagram Check", "Longest Word", "Capitalize First Letter",
    "Array Intersection", "Flatten Array", "Chunk Array", "Debounce Function", "Throttle Function",
    "Deep Clone Object", "Binary Search Tree Insert", "Linked List Reversal", "Graph BFS", "Graph DFS",
    "Quick Sort", "Merge Sort", "Heap Sort", "Dijkstra's Algorithm", "Bellman-Ford Algorithm",
    "Knapsack Problem", "Longest Common Subsequence", "Edit Distance", "Matrix Multiplication", "Sudoku Solver",
    "N-Queens Problem", "Traveling Salesman", "Minimum Spanning Tree", "Max Flow Min Cut", "Convex Hull",
    "Closest Pair of Points", "Fast Fourier Transform", "Suffix Array", "Trie Implementation", "Bloom Filter",
    "LRU Cache", "Consistent Hashing", "Distributed Lock", "Leader Election", "Consensus Algorithm",
    "Rate Limiter", "Circuit Breaker", "Idempotent API", "Event Sourcing", "CQRS Pattern",
    "Sharding Database", "Replication Strategies", "Load Balancing", "API Gateway", "Service Mesh"
  ];

  for (let i = 0; i < 20; i++) {
    problemsToCreate.push({
      questionText: `EASY: ${problemTitles[i % problemTitles.length]} - Problem ${i + 1}`,
      difficultyLevel: Difficulty.EASY,
      tags: JSON.stringify(['easy', 'basic', `tag${i}`]),
      maxScore: 100,
      isActive: true,
      createdById: adminUser.id,
    });
    problemsToCreate.push({
      questionText: `MEDIUM: ${problemTitles[i % problemTitles.length]} - Problem ${i + 1}`,
      difficultyLevel: Difficulty.MEDIUM,
      tags: JSON.stringify(['medium', 'intermediate', `tag${i}`]),
      maxScore: 200,
      isActive: true,
      createdById: adminUser.id,
    });
    problemsToCreate.push({
      questionText: `HARD: ${problemTitles[i % problemTitles.length]} - Problem ${i + 1}`,
      difficultyLevel: Difficulty.HARD,
      tags: JSON.stringify(['hard', 'advanced', `tag${i}`]),
      maxScore: 300,
      isActive: true,
      createdById: adminUser.id,
    });
  }

  // Use createMany for problems as they are new after reset
  await prisma.questionProblem.createMany({
    data: problemsToCreate,
  });
  const allProblems = await prisma.questionProblem.findMany();
  console.log(`Created ${allProblems.length} sample problems.`);

  // 6. Create a "CodeStorm Test Contest"
  let testContest = await prisma.contest.findUnique({
    where: { name: 'CodeStorm Test Contest' },
  });

  if (testContest) {
    // If contest exists, update it
    testContest = await prisma.contest.update({
      where: { id: testContest.id }, // Must use ID for update
      data: {
        description: 'A contest for testing all seeded problems and users.',
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: ContestStatus.RUNNING, // Set to RUNNING as per requirement
      },
    });
    console.log(`Updated contest: ${testContest.name} (Status: ${testContest.status})`);
  } else {
    // If contest does not exist, create it
    testContest = await prisma.contest.create({
      data: {
        name: 'CodeStorm Test Contest',
        description: 'A contest for testing all seeded problems and users.',
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: ContestStatus.RUNNING, // Set to RUNNING as per requirement
      },
    });
    console.log(`Created contest: ${testContest.name} (Status: ${testContest.status})`);
  }

  // Attach all problems to the contest
  const contestProblemsToCreate = allProblems.map((problem, index) => ({
    contestId: testContest.id,
    problemId: problem.id,
    order: index + 1,
    points: problem.maxScore, // Points match maxScore
  }));

  // Use a loop for upsert to handle re-running seed
  for (const cpData of contestProblemsToCreate) {
    await prisma.contestProblem.upsert({
      where: { contestId_problemId: { contestId: cpData.contestId, problemId: cpData.problemId } },
      update: { order: cpData.order, points: cpData.points },
      create: cpData,
    });
  }
  console.log(`Attached ${contestProblemsToCreate.length} problems to the contest.`);

  // 7. Join all 5 participants to the contest
  const contestUsersToCreate = participantUsers.map(user => ({
    contestId: testContest.id,
    userId: user.id,
    status: 'ACTIVE' as const,
  }));

  // Use a loop for upsert to handle re-running seed
  for (const cuData of contestUsersToCreate) {
    await prisma.contestUser.upsert({
      where: { contestId_userId: { contestId: cuData.contestId, userId: cuData.userId } },
      update: { status: cuData.status },
      create: cuData,
    });
  }
  console.log(`Enrolled ${contestUsersToCreate.length} participants in the contest.`);

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
