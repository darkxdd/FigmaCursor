#!/usr/bin/env node

/**
 * Test Runner Script
 * 
 * This script provides utilities for running different types of tests
 * and generating reports for the Figma-to-React Generator project.
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

const log = (message, color = 'reset') => {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

const runCommand = (command, description) => {
  log(`\n${description}...`, 'cyan')
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' })
    log(`✅ ${description} completed successfully`, 'green')
    return true
  } catch (error) {
    log(`❌ ${description} failed`, 'red')
    console.error(error.message)
    return false
  }
}

const generateTestReport = () => {
  const reportDir = 'test-reports'
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true })
  }

  const timestamp = new Date().toISOString()
  const report = {
    timestamp,
    testSuites: [
      {
        name: 'Unit Tests',
        description: 'Tests for utility functions and individual components',
        files: [
          'src/utils/__tests__/*.test.js',
          'src/services/__tests__/*.test.js',
          'src/components/__tests__/*.test.jsx',
        ],
      },
      {
        name: 'Integration Tests',
        description: 'End-to-end workflow and API integration tests',
        files: ['src/test/integration/*.test.js'],
      },
    ],
    coverage: {
      enabled: true,
      threshold: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
    performance: {
      enabled: true,
      maxTestDuration: 30000, // 30 seconds
      memoryThreshold: '512MB',
    },
  }

  const reportPath = join(reportDir, 'test-config.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  log(`📊 Test report configuration saved to ${reportPath}`, 'blue')
}

const runTestSuite = (suite) => {
  log(`\n${'='.repeat(50)}`, 'magenta')
  log(`Running ${suite.toUpperCase()} Tests`, 'bright')
  log(`${'='.repeat(50)}`, 'magenta')

  switch (suite) {
    case 'unit':
      return runCommand(
        'vitest run src/utils src/services src/components --reporter=verbose',
        'Unit Tests'
      )

    case 'integration':
      return runCommand(
        'vitest run src/test/integration --reporter=verbose',
        'Integration Tests'
      )

    case 'coverage':
      return runCommand(
        'vitest run --coverage --reporter=verbose',
        'Coverage Tests'
      )

    case 'performance':
      return runCommand(
        'vitest run --reporter=verbose --testTimeout=30000',
        'Performance Tests'
      )

    case 'watch':
      return runCommand('vitest --watch', 'Watch Mode')

    case 'ui':
      return runCommand('vitest --ui', 'UI Mode')

    case 'all':
      const results = [
        runCommand('vitest run --reporter=verbose', 'All Tests'),
        runCommand('vitest run --coverage --reporter=json', 'Coverage Report'),
      ]
      return results.every(Boolean)

    default:
      log(`❌ Unknown test suite: ${suite}`, 'red')
      return false
  }
}

const showHelp = () => {
  log('\n📋 Test Runner Help', 'bright')
  log('===================', 'bright')
  log('\nAvailable commands:', 'cyan')
  log('  unit        - Run unit tests only', 'yellow')
  log('  integration - Run integration tests only', 'yellow')
  log('  coverage    - Run tests with coverage report', 'yellow')
  log('  performance - Run performance tests', 'yellow')
  log('  watch       - Run tests in watch mode', 'yellow')
  log('  ui          - Run tests with UI interface', 'yellow')
  log('  all         - Run all tests with coverage', 'yellow')
  log('  report      - Generate test configuration report', 'yellow')
  log('  help        - Show this help message', 'yellow')
  log('\nExamples:', 'cyan')
  log('  npm run test:unit', 'green')
  log('  npm run test:coverage', 'green')
  log('  npm run test:watch', 'green')
  log('')
}

const main = () => {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'

  log('🧪 Figma-to-React Generator Test Runner', 'bright')
  log('======================================', 'bright')

  switch (command) {
    case 'report':
      generateTestReport()
      break

    case 'help':
      showHelp()
      break

    default:
      const success = runTestSuite(command)
      process.exit(success ? 0 : 1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { runTestSuite, generateTestReport, showHelp }