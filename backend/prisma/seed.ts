import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create dummy users
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordJudge = await bcrypt.hash('judge123', 10);
  const hashedPasswordParticipant = await bcrypt.hash('participant123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPasswordAdmin,
      role: 'ADMIN',
    },
  });

  const judge = await prisma.user.upsert({
    where: { username: 'judge' },
    update: {},
    create: {
      username: 'judge',
      password: hashedPasswordJudge,
      role: 'JUDGE',
    },
  });

  const participant = await prisma.user.upsert({
    where: { username: 'participant' },
    update: {},
    create: {
      username: 'participant',
      password: hashedPasswordParticipant,
      role: 'PARTICIPANT',
    },
  });

  console.log('Dummy users created.');

  // 2. Seed problems from easy.json
  const problemsDataPath = path.join(__dirname, '../../easy.json'); // Adjust path as needed
  const problemsData = JSON.parse(fs.readFileSync(problemsDataPath, 'utf-8'));

  const easyProblems = problemsData.easy_problems.map((p: any) => ({
    title: p.title,
    description: p.description,
    difficulty: 'Easy',
    points: 0.5,
    test_cases: p.test_cases,
    hidden_judge_notes: null,
  }));

  const forLoopProblems = problemsData.for_loop_problems.map((p: any) => ({
    title: p.title,
    description: p.description,
    difficulty: 'Medium',
    points: 1.0,
    test_cases: p.test_cases,
    hidden_judge_notes: null,
  }));

  const problemSolvingChallenges = problemsData.problem_solving_challenges.map((p: any) => ({
    title: p.title,
    description: p.description,
    difficulty: 'Hard',
    points: 5.0,
    test_cases: p.test_cases,
    hidden_judge_notes: null,
  }));

  const allProblems = [...easyProblems, ...forLoopProblems, ...problemSolvingChallenges];

  for (const problem of allProblems) {
    await prisma.problem.upsert({
      where: { title: problem.title },
      update: {},
      create: problem,
    });
  }

  console.log('Problems seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });