import { PrismaClient, Difficulty, ContestStatus, SubmissionStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Comprehensive data migration script for CodeStorm platform
 * Migrates legacy data to new comprehensive schema
 */

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
}

/**
 * Migration 1: Transform legacy Problem model data to QuestionProblem format
 */
export async function migrateLegacyProblemsToQuestionProblems(): Promise<MigrationResult> {
  console.log('🔄 Starting migration: Legacy Problems -> QuestionProblems');
  
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: []
  };

  try {
    const legacyProblems = await prisma.problem.findMany();
    console.log(`Found ${legacyProblems.length} legacy problems`);

    for (const legacyProblem of legacyProblems) {
      try {
        // Check if already migrated
        const existing = await prisma.questionProblem.findFirst({
          where: {
            questionText: {
              contains: legacyProblem.title
            }
          }
        });

        if (existing) {
          result.skippedCount++;
          continue;
        }

        // Map difficulty
        let difficultyLevel: Difficulty;
        switch (legacyProblem.difficulty.toUpperCase()) {
          case 'EASY':
            difficultyLevel = Difficulty.EASY;
            break;
          case 'MEDIUM':
            difficultyLevel = Difficulty.MEDIUM;
            break;
          case 'HARD':
            difficultyLevel = Difficulty.HARD;
            break;
          default:
            difficultyLevel = Difficulty.MEDIUM;
        }

        // Create QuestionProblem
        await prisma.questionProblem.create({
          data: {
            questionText: `${legacyProblem.title}\n\n${legacyProblem.description}`,
            difficultyLevel,
            tags: legacyProblem.difficulty.toLowerCase(),
            maxScore: legacyProblem.points,
            isActive: true,
            createdAt: new Date()
          }
        });

        result.migratedCount++;
        console.log(`✅ Migrated: ${legacyProblem.title}`);

      } catch (error) {
        result.errorCount++;
        const errorMsg = `Error migrating problem ${legacyProblem.title}: ${error}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`✅ Problem migration completed: ${result.migratedCount} migrated, ${result.skippedCount} skipped, ${result.errorCount} errors`);
    return result;

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    console.error(`❌ Problem migration failed: ${error}`);
    return result;
  }
}

/**
 * Migration 2: Transform ScoreEvent data to Review and Leaderboard models
 */
export async function migrateScoreEventsToReviewsAndLeaderboard(): Promise<MigrationResult> {
  console.log('🔄 Starting migration: ScoreEvents -> Reviews & Leaderboard');
  
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: []
  };

  try {
    const scoreEvents = await prisma.scoreEvent.findMany({
      include: {
        submission: {
          include: {
            submittedBy: true,
            problem: true
          }
        },
        user: true
      }
    });

    console.log(`Found ${scoreEvents.length} score events`);

    // Get or create default contest for legacy data
    let defaultContest = await prisma.contest.findFirst({
      where: { name: 'Legacy Contest' }
    });

    if (!defaultContest) {
      defaultContest = await prisma.contest.create({
        data: {
          name: 'Legacy Contest',
          description: 'Default contest for migrated legacy data',
          status: ContestStatus.ARCHIVED,
          startTime: new Date('2024-01-01'),
          endTime: new Date('2024-12-31')
        }
      });
    }

    // Get system user for reviews (or create one)
    let systemUser = await prisma.user.findFirst({
      where: { username: 'system' }
    });

    if (!systemUser) {
      // Get admin role
      let adminRole = await prisma.role.findFirst({
        where: { name: 'admin' }
      });

      if (!adminRole) {
        adminRole = await prisma.role.create({
          data: {
            name: 'admin',
            description: 'System administrator'
          }
        });
      }

      systemUser = await prisma.user.create({
        data: {
          username: 'system',
          displayName: 'System',
          password: 'system_generated',
          roleId: adminRole.id
        }
      });
    }

    for (const scoreEvent of scoreEvents) {
      try {
        // Check if review already exists
        const existingReview = await prisma.review.findFirst({
          where: { submissionId: scoreEvent.submissionId }
        });

        if (existingReview) {
          result.skippedCount++;
          continue;
        }

        // Find corresponding QuestionProblem
        // Since we don't have a direct title field, we'll try to match by ID or create a default one
        let questionProblem = await prisma.questionProblem.findFirst({
          where: {
            id: scoreEvent.submission.problemId
          }
        });

        if (!questionProblem) {
          // Create a default QuestionProblem if none exists
          questionProblem = await prisma.questionProblem.create({
            data: {
              questionText: `Legacy Problem (migrated from submission ${scoreEvent.submissionId})`,
              difficultyLevel: 'MEDIUM',
              maxScore: scoreEvent.points,
              isActive: true
            }
          });
        }

        // questionProblem is guaranteed to exist now due to the create above

        // Create Review record
        await prisma.review.create({
          data: {
            submissionId: scoreEvent.submissionId,
            problemId: questionProblem.id,
            submittedById: scoreEvent.userId,
            reviewedById: systemUser.id,
            timestamp: scoreEvent.acceptedAt,
            correct: scoreEvent.points > 0,
            scoreAwarded: scoreEvent.points,
            remarks: 'Migrated from legacy ScoreEvent'
          }
        });

        // Update submission status
        await prisma.submission.update({
          where: { id: scoreEvent.submissionId },
          data: {
            status: scoreEvent.points > 0 ? SubmissionStatus.ACCEPTED : SubmissionStatus.REJECTED,
            score: scoreEvent.points,
            reviewedById: systemUser.id,
            contestId: defaultContest.id,
            problemId: questionProblem.id
          }
        });

        result.migratedCount++;
        console.log(`✅ Migrated ScoreEvent: ${scoreEvent.id}`);

      } catch (error) {
        result.errorCount++;
        const errorMsg = `Error migrating score event ${scoreEvent.id}: ${error}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Generate leaderboard entries
    await generateLeaderboardFromReviews(defaultContest.id);

    console.log(`✅ ScoreEvent migration completed: ${result.migratedCount} migrated, ${result.skippedCount} skipped, ${result.errorCount} errors`);
    return result;

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    console.error(`❌ ScoreEvent migration failed: ${error}`);
    return result;
  }
}

/**
 * Migration 3: Transform ContestState to Contest and SystemControl models
 */
export async function migrateContestStateToContestAndSystemControl(): Promise<MigrationResult> {
  console.log('🔄 Starting migration: ContestState -> Contest & SystemControl');
  
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: []
  };

  try {
    const contestStates = await prisma.contestState.findMany();
    console.log(`Found ${contestStates.length} contest states`);

    // Get system user
    const systemUser = await prisma.user.findFirst({
      where: { username: 'system' }
    });

    if (!systemUser) {
      result.errors.push('System user not found - run user migration first');
      result.success = false;
      return result;
    }

    for (const contestState of contestStates) {
      try {
        // Check if contest already exists for this state
        const existingContest = await prisma.contest.findFirst({
          where: {
            name: `Contest ${contestState.phase}`
          }
        });

        if (existingContest) {
          result.skippedCount++;
          continue;
        }

        // Map phase to contest status
        let status: ContestStatus;
        switch (contestState.phase) {
          case 'Setup':
            status = ContestStatus.PLANNED;
            break;
          case 'Reading':
          case 'Running':
            status = ContestStatus.RUNNING;
            break;
          case 'Locked':
          case 'Results':
            status = ContestStatus.ENDED;
            break;
          default:
            status = ContestStatus.PLANNED;
        }

        // Create Contest
        const contest = await prisma.contest.create({
          data: {
            name: `Contest ${contestState.phase}`,
            description: `Migrated from legacy ContestState (${contestState.phase})`,
            startTime: contestState.startTime,
            endTime: contestState.endTime,
            status
          }
        });

        // Create SystemControl record
        await prisma.systemControl.create({
          data: {
            contestId: contest.id,
            controlCode: 820, // Phase Control permission code
            value: {
              phase: contestState.phase,
              migratedFrom: 'ContestState',
              originalId: contestState.id
            },
            setById: systemUser.id,
            setAt: contestState.lastUpdated
          }
        });

        result.migratedCount++;
        console.log(`✅ Migrated ContestState: ${contestState.phase} -> ${contest.id}`);

      } catch (error) {
        result.errorCount++;
        const errorMsg = `Error migrating contest state ${contestState.id}: ${error}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`✅ ContestState migration completed: ${result.migratedCount} migrated, ${result.skippedCount} skipped, ${result.errorCount} errors`);
    return result;

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    console.error(`❌ ContestState migration failed: ${error}`);
    return result;
  }
}

/**
 * Migration 4: Update existing users to use new role-permission system
 */
export async function migrateUsersToRolePermissionSystem(): Promise<MigrationResult> {
  console.log('🔄 Starting migration: Users -> Role-Permission System');
  
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: []
  };

  try {
    // First, ensure roles and permissions exist
    await setupRolesAndPermissions();

    const users = await prisma.user.findMany({
      include: { role: true }
    });

    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      try {
        // Check if user already has proper role assignment
        if (user.role && user.role.name) {
          result.skippedCount++;
          continue;
        }

        // Assign default role based on username patterns or create participant role
        let targetRole = await prisma.role.findFirst({
          where: { name: 'participant' }
        });

        // Special cases for admin users
        if (user.username.includes('admin') || user.username.includes('judge')) {
          const roleName = user.username.includes('admin') ? 'admin' : 'judge';
          targetRole = await prisma.role.findFirst({
            where: { name: roleName }
          });
        }

        if (!targetRole) {
          targetRole = await prisma.role.findFirst({
            where: { name: 'participant' }
          });
        }

        if (!targetRole) {
          result.errorCount++;
          result.errors.push(`No suitable role found for user ${user.username}`);
          continue;
        }

        // Update user with proper role
        await prisma.user.update({
          where: { id: user.id },
          data: {
            roleId: targetRole.id,
            // Set default values for new fields if they're null
            scored: user.scored || 0,
            problemsSolvedCount: user.problemsSolvedCount || 0
          }
        });

        result.migratedCount++;
        console.log(`✅ Migrated user: ${user.username} -> ${targetRole.name}`);

      } catch (error) {
        result.errorCount++;
        const errorMsg = `Error migrating user ${user.username}: ${error}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log(`✅ User migration completed: ${result.migratedCount} migrated, ${result.skippedCount} skipped, ${result.errorCount} errors`);
    return result;

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
    console.error(`❌ User migration failed: ${error}`);
    return result;
  }
}

/**
 * Helper function to set up roles and permissions
 */
async function setupRolesAndPermissions() {
  console.log('🔧 Setting up roles and permissions...');

  // Define permission hierarchy
  const permissions = [
    // Dashboard permissions
    { code: 100, name: 'Dashboard', description: 'Access to dashboard', parent: null },
    
    // Problem permissions
    { code: 200, name: 'Problems', description: 'Access to problems', parent: null },
    { code: 210, name: 'View Question', description: 'View question details', parent: 200 },
    { code: 220, name: 'Add Submission', description: 'Submit solutions', parent: 200 },
    { code: 230, name: 'Total Score', description: 'View total score', parent: 200 },
    
    // Judge permissions
    { code: 300, name: 'Judge Queue', description: 'Access to judge queue', parent: null },
    { code: 310, name: 'View Submission', description: 'View submissions for judging', parent: 300 },
    { code: 320, name: 'View Queue List', description: 'View judge queue list', parent: 300 },
    
    // User management permissions
    { code: 500, name: 'Users', description: 'User management', parent: null },
    
    // Analytics permissions
    { code: 600, name: 'Analytics', description: 'Access to analytics', parent: null },
    
    // Export permissions
    { code: 700, name: 'Exports', description: 'Data export capabilities', parent: null },
    
    // Contest control permissions
    { code: 800, name: 'Contest Control', description: 'Contest management', parent: null },
    { code: 810, name: 'Timer Control', description: 'Contest timer control', parent: 800 },
    { code: 820, name: 'Phase Control', description: 'Contest phase control', parent: 800 },
    { code: 830, name: 'Display Control', description: 'Contest display control', parent: 800 },
    { code: 840, name: 'Emergency Actions', description: 'Emergency contest actions', parent: 800 },
    { code: 850, name: 'Problem Control', description: 'Contest problem management', parent: 800 },
    { code: 860, name: 'User Control', description: 'Contest user management', parent: 800 },
    
    // Audit permissions
    { code: 900, name: 'Audit Log', description: 'Access to audit logs', parent: null },
    
    // Backup permissions
    { code: 1000, name: 'Backup', description: 'System backup management', parent: null },
    
    // Attendance permissions
    { code: 1100, name: 'Attendance', description: 'Attendance tracking', parent: null }
  ];

  // Create permissions
  const createdPermissions = new Map();
  
  // First pass: create permissions without parents
  for (const perm of permissions.filter(p => p.parent === null)) {
    const existing = await prisma.permission.findFirst({ where: { code: perm.code } });
    if (!existing) {
      const created = await prisma.permission.create({
        data: {
          code: perm.code,
          name: perm.name,
          description: perm.description
        }
      });
      createdPermissions.set(perm.code, created);
    } else {
      createdPermissions.set(perm.code, existing);
    }
  }

  // Second pass: create permissions with parents
  for (const perm of permissions.filter(p => p.parent !== null)) {
    const existing = await prisma.permission.findFirst({ where: { code: perm.code } });
    if (!existing) {
      const parentPerm = createdPermissions.get(perm.parent);
      const created = await prisma.permission.create({
        data: {
          code: perm.code,
          name: perm.name,
          description: perm.description,
          parentPermissionId: parentPerm?.id
        }
      });
      createdPermissions.set(perm.code, created);
    } else {
      createdPermissions.set(perm.code, existing);
    }
  }

  // Create roles
  const roles = [
    {
      name: 'admin',
      description: 'System administrator',
      permissions: [100, 500, 600, 700, 800, 810, 820, 830, 840, 850, 860, 900, 1000, 1100]
    },
    {
      name: 'judge',
      description: 'Contest judge',
      permissions: [300, 310, 320]
    },
    {
      name: 'participant',
      description: 'Contest participant',
      permissions: [200, 210, 220, 230]
    }
  ];

  for (const roleData of roles) {
    let role = await prisma.role.findFirst({ where: { name: roleData.name } });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description
        }
      });
    }

    // Assign permissions to role
    for (const permCode of roleData.permissions) {
      const permission = createdPermissions.get(permCode);
      if (permission) {
        const existing = await prisma.rolePermission.findFirst({
          where: {
            roleId: role.id,
            permissionId: permission.id
          }
        });

        if (!existing) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
              inherited: false
            }
          });
        }
      }
    }
  }

  console.log('✅ Roles and permissions setup completed');
}

/**
 * Helper function to generate leaderboard from reviews
 */
async function generateLeaderboardFromReviews(contestId: string) {
  console.log('🔧 Generating leaderboard from reviews...');

  const reviews = await prisma.review.findMany({
    where: {
      submission: {
        contestId: contestId
      }
    },
    include: {
      submittedBy: true,
      submission: true
    }
  });

  // Group by user and calculate stats
  const userStats = new Map();

  for (const review of reviews) {
    const userId = review.submittedById;
    if (!userStats.has(userId)) {
      userStats.set(userId, {
        userId,
        totalScore: 0,
        problemsSolved: 0,
        lastSubmissionTime: review.submission.timestamp
      });
    }

    const stats = userStats.get(userId);
    if (review.correct) {
      stats.totalScore += review.scoreAwarded;
      stats.problemsSolved += 1;
    }
    
    if (review.submission.timestamp > stats.lastSubmissionTime) {
      stats.lastSubmissionTime = review.submission.timestamp;
    }
  }

  // Create leaderboard entries
  const sortedUsers = Array.from(userStats.values())
    .sort((a, b) => {
      if (a.totalScore !== b.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return a.lastSubmissionTime.getTime() - b.lastSubmissionTime.getTime();
    });

  for (let i = 0; i < sortedUsers.length; i++) {
    const userStat = sortedUsers[i];
    
    const existing = await prisma.leaderboard.findFirst({
      where: {
        contestId,
        userId: userStat.userId
      }
    });

    if (!existing) {
      await prisma.leaderboard.create({
        data: {
          contestId,
          userId: userStat.userId,
          rank: i + 1,
          score: userStat.totalScore,
          problemsSolved: userStat.problemsSolved,
          lastSubmissionTime: userStat.lastSubmissionTime
        }
      });
    }
  }

  console.log(`✅ Generated leaderboard for ${sortedUsers.length} users`);
}

/**
 * Run all migrations in sequence
 */
export async function runAllMigrations(): Promise<void> {
  console.log('🚀 Starting comprehensive data migration...');
  
  const migrations = [
    { name: 'Legacy Problems -> QuestionProblems', fn: migrateLegacyProblemsToQuestionProblems },
    { name: 'Users -> Role-Permission System', fn: migrateUsersToRolePermissionSystem },
    { name: 'ScoreEvents -> Reviews & Leaderboard', fn: migrateScoreEventsToReviewsAndLeaderboard },
    { name: 'ContestState -> Contest & SystemControl', fn: migrateContestStateToContestAndSystemControl }
  ];

  const results = [];

  for (const migration of migrations) {
    console.log(`\n📋 Running: ${migration.name}`);
    const result = await migration.fn();
    results.push({ name: migration.name, result });
    
    if (!result.success) {
      console.error(`❌ Migration failed: ${migration.name}`);
      console.error('Errors:', result.errors);
      break;
    }
  }

  console.log('\n📊 Migration Summary:');
  for (const { name, result } of results) {
    console.log(`${result.success ? '✅' : '❌'} ${name}: ${result.migratedCount} migrated, ${result.skippedCount} skipped, ${result.errorCount} errors`);
  }

  console.log('\n🎉 Data migration completed!');
}

// CLI execution
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}