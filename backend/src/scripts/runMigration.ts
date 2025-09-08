#!/usr/bin/env node

import { Command } from 'commander';
import {
  runAllMigrations,
  migrateLegacyProblemsToQuestionProblems,
  migrateScoreEventsToReviewsAndLeaderboard,
  migrateContestStateToContestAndSystemControl,
  migrateUsersToRolePermissionSystem
} from '../migrations/dataMigration';

const program = new Command();

program
  .name('migrate')
  .description('CodeStorm data migration utility')
  .version('1.0.0');

program
  .command('all')
  .description('Run all migrations in sequence')
  .action(async () => {
    try {
      console.log('🚀 Starting complete data migration...');
      await runAllMigrations();
      console.log('✅ All migrations completed successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  });

program
  .command('problems')
  .description('Migrate legacy problems to QuestionProblems')
  .action(async () => {
    try {
      console.log('🔄 Migrating legacy problems...');
      const result = await migrateLegacyProblemsToQuestionProblems();
      
      if (result.success) {
        console.log(`✅ Problems migration completed: ${result.migratedCount} migrated, ${result.skippedCount} skipped`);
      } else {
        console.error('❌ Problems migration failed:', result.errors);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  });

program
  .command('users')
  .description('Migrate users to role-permission system')
  .action(async () => {
    try {
      console.log('🔄 Migrating users to role-permission system...');
      const result = await migrateUsersToRolePermissionSystem();
      
      if (result.success) {
        console.log(`✅ Users migration completed: ${result.migratedCount} migrated, ${result.skippedCount} skipped`);
      } else {
        console.error('❌ Users migration failed:', result.errors);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  });

program
  .command('scores')
  .description('Migrate ScoreEvents to Reviews and Leaderboard')
  .action(async () => {
    try {
      console.log('🔄 Migrating score events...');
      const result = await migrateScoreEventsToReviewsAndLeaderboard();
      
      if (result.success) {
        console.log(`✅ Score events migration completed: ${result.migratedCount} migrated, ${result.skippedCount} skipped`);
      } else {
        console.error('❌ Score events migration failed:', result.errors);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  });

program
  .command('contests')
  .description('Migrate ContestState to Contest and SystemControl')
  .action(async () => {
    try {
      console.log('🔄 Migrating contest states...');
      const result = await migrateContestStateToContestAndSystemControl();
      
      if (result.success) {
        console.log(`✅ Contest states migration completed: ${result.migratedCount} migrated, ${result.skippedCount} skipped`);
      } else {
        console.error('❌ Contest states migration failed:', result.errors);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check migration status and data counts')
  .action(async () => {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      console.log('📊 Current database status:');
      console.log('');

      // Legacy data counts
      const legacyProblems = await prisma.problem.count();
      const scoreEvents = await prisma.scoreEvent.count();
      const contestStates = await prisma.contestState.count();

      console.log('Legacy Data:');
      console.log(`  Problems: ${legacyProblems}`);
      console.log(`  ScoreEvents: ${scoreEvents}`);
      console.log(`  ContestStates: ${contestStates}`);
      console.log('');

      // New schema data counts
      const questionProblems = await prisma.questionProblem.count();
      const reviews = await prisma.review.count();
      const contests = await prisma.contest.count();
      const users = await prisma.user.count();
      const roles = await prisma.role.count();
      const permissions = await prisma.permission.count();
      const leaderboard = await prisma.leaderboard.count();

      console.log('New Schema Data:');
      console.log(`  QuestionProblems: ${questionProblems}`);
      console.log(`  Reviews: ${reviews}`);
      console.log(`  Contests: ${contests}`);
      console.log(`  Users: ${users}`);
      console.log(`  Roles: ${roles}`);
      console.log(`  Permissions: ${permissions}`);
      console.log(`  Leaderboard entries: ${leaderboard}`);
      console.log('');

      // Migration recommendations
      console.log('Migration Recommendations:');
      if (legacyProblems > 0 && questionProblems === 0) {
        console.log('  ⚠️  Run: npm run migrate problems');
      }
      if (users > 0 && roles === 0) {
        console.log('  ⚠️  Run: npm run migrate users');
      }
      if (scoreEvents > 0 && reviews === 0) {
        console.log('  ⚠️  Run: npm run migrate scores');
      }
      if (contestStates > 0 && contests === 0) {
        console.log('  ⚠️  Run: npm run migrate contests');
      }
      if (legacyProblems === 0 && scoreEvents === 0 && contestStates === 0) {
        console.log('  ✅ All legacy data appears to be migrated');
      }

      await prisma.$disconnect();
    } catch (error) {
      console.error('❌ Status check failed:', error);
      process.exit(1);
    }
  });

program.parse();