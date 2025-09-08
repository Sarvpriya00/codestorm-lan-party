import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

describe('ProblemController Integration Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.submission.deleteMany();
    await prisma.contestProblem.deleteMany();
    await prisma.questionProblem.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.submission.deleteMany();
    await prisma.contestProblem.deleteMany();
    await prisma.questionProblem.deleteMany();
    await prisma.contestUser.deleteMany();
    await prisma.contest.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
  });

  it('should create a QuestionProblem successfully', async () => {
    // Create a test role and user first
    const role = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrator role'
      }
    });

    const user = await prisma.user.create({
      data: {
        username: 'testadmin',
        password: 'hashedpassword',
        roleId: role.id
      }
    });

    const problem = await prisma.questionProblem.create({
      data: {
        questionText: 'Test Problem\n\nThis is a test problem description',
        difficultyLevel: Difficulty.EASY,
        tags: '["array", "sorting"]',
        maxScore: 100,
        createdById: user.id,
        isActive: true
      }
    });

    expect(problem).toBeDefined();
    expect(problem.questionText).toBe('Test Problem\n\nThis is a test problem description');
    expect(problem.difficultyLevel).toBe(Difficulty.EASY);
    expect(problem.maxScore).toBe(100);
    expect(problem.isActive).toBe(true);
  });

  it('should create a contest with problems', async () => {
    // Create test data
    const role = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrator role'
      }
    });

    const user = await prisma.user.create({
      data: {
        username: 'testadmin',
        password: 'hashedpassword',
        roleId: role.id
      }
    });

    const contest = await prisma.contest.create({
      data: {
        name: 'Test Contest',
        description: 'A test contest',
        status: 'RUNNING'
      }
    });

    const problem = await prisma.questionProblem.create({
      data: {
        questionText: 'Contest Problem\n\nThis is a contest problem',
        difficultyLevel: Difficulty.MEDIUM,
        maxScore: 150,
        createdById: user.id,
        isActive: true
      }
    });

    const contestProblem = await prisma.contestProblem.create({
      data: {
        contestId: contest.id,
        problemId: problem.id,
        order: 1,
        points: 150
      }
    });

    expect(contestProblem).toBeDefined();
    expect(contestProblem.contestId).toBe(contest.id);
    expect(contestProblem.problemId).toBe(problem.id);
    expect(contestProblem.points).toBe(150);
  });

  it('should handle problem filtering by difficulty', async () => {
    // Create test data
    const role = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrator role'
      }
    });

    const user = await prisma.user.create({
      data: {
        username: 'testadmin',
        password: 'hashedpassword',
        roleId: role.id
      }
    });

    // Create problems with different difficulties
    await prisma.questionProblem.createMany({
      data: [
        {
          questionText: 'Easy Problem',
          difficultyLevel: Difficulty.EASY,
          maxScore: 50,
          createdById: user.id,
          isActive: true
        },
        {
          questionText: 'Medium Problem',
          difficultyLevel: Difficulty.MEDIUM,
          maxScore: 100,
          createdById: user.id,
          isActive: true
        },
        {
          questionText: 'Hard Problem',
          difficultyLevel: Difficulty.HARD,
          maxScore: 200,
          createdById: user.id,
          isActive: true
        }
      ]
    });

    // Test filtering by difficulty
    const easyProblems = await prisma.questionProblem.findMany({
      where: {
        difficultyLevel: Difficulty.EASY,
        isActive: true
      }
    });

    const mediumProblems = await prisma.questionProblem.findMany({
      where: {
        difficultyLevel: Difficulty.MEDIUM,
        isActive: true
      }
    });

    expect(easyProblems).toHaveLength(1);
    expect(mediumProblems).toHaveLength(1);
    expect(easyProblems[0].difficultyLevel).toBe(Difficulty.EASY);
    expect(mediumProblems[0].difficultyLevel).toBe(Difficulty.MEDIUM);
  });

  it('should create submissions with contest association', async () => {
    // Create test data
    const role = await prisma.role.create({
      data: {
        name: 'PARTICIPANT',
        description: 'Participant role'
      }
    });

    const user = await prisma.user.create({
      data: {
        username: 'testparticipant',
        password: 'hashedpassword',
        roleId: role.id
      }
    });

    const contest = await prisma.contest.create({
      data: {
        name: 'Test Contest',
        description: 'A test contest',
        status: 'RUNNING'
      }
    });

    const problem = await prisma.questionProblem.create({
      data: {
        questionText: 'Test Problem',
        difficultyLevel: Difficulty.EASY,
        maxScore: 100,
        createdById: user.id,
        isActive: true
      }
    });

    const contestProblem = await prisma.contestProblem.create({
      data: {
        contestId: contest.id,
        problemId: problem.id,
        order: 1,
        points: 100
      }
    });

    const contestUser = await prisma.contestUser.create({
      data: {
        contestId: contest.id,
        userId: user.id,
        status: 'ACTIVE'
      }
    });

    const submission = await prisma.submission.create({
      data: {
        problemId: problem.id,
        contestId: contest.id,
        submittedById: user.id,
        codeText: 'console.log("Hello World");',
        status: 'PENDING',
        score: 0
      }
    });

    expect(submission).toBeDefined();
    expect(submission.problemId).toBe(problem.id);
    expect(submission.contestId).toBe(contest.id);
    expect(submission.submittedById).toBe(user.id);
    expect(submission.status).toBe('PENDING');
  });
});