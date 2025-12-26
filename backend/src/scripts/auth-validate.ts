#!/usr/bin/env node

/**
 * Authentication Validation Script
 * Lightweight checker that validates existing tokens
 * Does NOT start OAuth flow - only validates what exists
 *
 * Exit codes:
 * 0 = Valid authentication
 * 1 = Invalid or missing authentication
 */

import { getYouTubeAuthService } from '../services/youtube-auth.service.js';
import { config } from 'dotenv';

config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  try {
    const authService = getYouTubeAuthService();

    // Check if authenticated
    const isAuth = await authService.isAuthenticated();

    if (!isAuth) {
      log('\n❌ No valid authentication found', colors.red);
      log('→ Run: npm run auth:setup', colors.yellow);
      log('→ This will authenticate your YouTube account\n', colors.yellow);
      process.exit(1);
    }

    // Get user info to display
    try {
      const userInfo = await authService.getUserInfo();
      log(`✓ Authenticated as: ${userInfo.email}`, colors.green);

      // Validate against expected email if set
      const expectedEmail = process.env.YOUTUBE_ACCOUNT_EMAIL;
      if (expectedEmail && userInfo.email !== expectedEmail) {
        log(
          `⚠️  Warning: Account (${userInfo.email}) differs from expected (${expectedEmail})`,
          colors.yellow
        );
      }
    } catch (error) {
      // If we can't get user info but isAuthenticated passed, something is wrong
      log('\n❌ Token validation failed', colors.red);
      log('→ Run: npm run auth:setup', colors.yellow);
      log('→ To re-authenticate your YouTube account\n', colors.yellow);
      process.exit(1);
    }

    process.exit(0);
  } catch (error: any) {
    log(`\n❌ Validation failed: ${error.message}`, colors.red);
    log('→ Run: npm run auth:setup\n', colors.yellow);
    process.exit(1);
  }
}

main();
