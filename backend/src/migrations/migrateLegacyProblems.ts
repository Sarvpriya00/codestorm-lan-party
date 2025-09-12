import { PrismaClient, Difficulty, SubmissionStatus } from '@prisma/client';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
interface JsonObject extends Record<string, JsonValue> {}
interface JsonArray extends Array<JsonValue> {}

const prisma = new PrismaClient();

interface LegacyProblem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  points: number;
  test_cases: JsonObject;
  hidden_judge_notes?: string;
}

/**
 * Migration script to convert legacy Problem model data to QuestionProblem format
 */
export async function migrateLegacyProblems() {
  console.log('Starting migration of legacy problems to QuestionProblem format...');

  try {
    // Fetch all legacy problems
    const legacyProblems = await prisma.problem.findMany();
    console.log(`Found ${legacyProblems.length} legacy problems to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const legacyProblem of legacyProblems) {
      try {
        // Check if this problem has already been migrated
        const existingQuestionProblem = await prisma.questionProblem.findFirst({
          where: {
            questionText: {
              contains: legacyProblem.title
            }
          }
        });

        if (existingQuestionProblem) {
          console.log(`Skipping already migrated problem: ${legacyProblem.title}`);
          skippedCount++;
          continue;
        }

        // Map legacy difficulty to enum
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
            difficultyLevel = Difficulty.MEDIUM; // Default fallback
        }

        // Create new QuestionProblem
        const questionProblem = await prisma.questionProblem.create({
          data: {
            questionText: `${legacyProblem.title}\n\n${legacyProblem.description}`,
            difficultyLevel,
            tags: JSON.stringify([legacyProblem.difficulty.toLowerCase()]), // Store as JSON string for now
            maxScore: legacyProblem.points,
            isActive: true,
            createdAt: new Date()
          }
        });

        console.log(`Migrated problem: ${legacyProblem.title} -> ${questionProblem.id}`);
        migratedCount++;

      } catch (error) {
        console.error(`Error migrating problem ${legacyProblem.title}:`, error);
      }
    }

    console.log(`Migration completed. Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
    
    return {
      success: true,
      migratedCount,
      skippedCount,
      totalLegacyProblems: legacyProblems.length
    };

  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Migration script to convert legacy submissions to new schema format
 */
export async function migrateLegacySubmissions() {
  console.log('Starting migration of legacy submissions to new schema format...');

  try {
    // Get all legacy submissions that don't have contest association
    const legacySubmissions = await prisma.submission.findMany({
      where: {
        contestId: ""
      }
    });

    console.log(`Found ${legacySubmissions.length} legacy submissions to migrate`);

    // For now, we'll need a default contest to associate these submissions with
    // In a real migration, you'd want to create appropriate contests or ask for user input
    let defaultContest = await prisma.contest.findFirst({
      where: {
        name: 'Legacy Contest'
      }
    });

    if (!defaultContest) {
      defaultContest = await prisma.contest.create({
        data: {
          name: 'Legacy Contest',
          description: 'Default contest for migrated legacy submissions',
          status: 'ARCHIVED'
        }
      });
      console.log('Created default legacy contest');
    }

    let migratedCount = 0;

    for (const submission of legacySubmissions) {
      try {
        // For now, skip legacy submission migration as it requires more complex logic
        // This would need to be implemented based on the actual legacy data structure
        console.log(`Skipping submission migration for ${submission.id} - requires manual mapping`);
        continue;

        migratedCount++;
        console.log(`Migrated submission ${submission.id}`);

      } catch (error) {
        console.error(`Error migrating submission ${submission.id}:`, error);
      }
    }

    console.log(`Submission migration completed. Migrated: ${migratedCount}`);
    
    return {
      success: true,
      migratedCount,
      totalLegacySubmissions: legacySubmissions.length
    };

  } catch (error) {
    console.error('Submission migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function mapLegacyStatus(legacyStatus: string): SubmissionStatus {
  // Map legacy Verdict enum to new SubmissionStatus
  switch (legacyStatus) {
    case 'PENDING':
      return 'PENDING';
    case 'ACCEPTED':
      return 'ACCEPTED';
    case 'REJECTED':
    case 'WRONG_ANSWER':
    case 'TIME_LIMIT_EXCEEDED':
    case 'MEMORY_LIMIT_EXCEEDED':
    case 'RUNTIME_ERROR':
    case 'COMPILATION_ERROR':
      return 'REJECTED';
    default:
      return 'PENDING';
  }
}

// CLI execution
if (require.main === module) {
  migrateLegacyProblems()
    .then((result) => {
      console.log('Problem migration result:', result);
      return migrateLegacySubmissions();
    })
    .then((result) => {
      console.log('Submission migration result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}