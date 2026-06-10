const { execSync } = require('child_process');

try {
  const branchName = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

  // Bypass branch check for main/master/develop, or if in CI/detached HEAD
  if (branchName === 'main' || branchName === 'master' || branchName === 'develop' || branchName === 'HEAD') {
    process.exit(0);
  }

  // Regex to strictly enforce feature/mX-<desc>
  const branchRegex = /^feature\/m\d+-[a-zA-Z0-9_-]+$/;

  if (!branchRegex.test(branchName)) {
    console.error('\x1b[31m%s\x1b[0m', `ERROR: Invalid branch name "${branchName}".`);
    console.error('\x1b[33m%s\x1b[0m', 'Branch name must strictly follow the pattern: feature/mX-<desc> (e.g., feature/m01-login-page)');
    process.exit(1);
  }
} catch (error) {
  // If not in a git repo or other git error, don't block
  process.exit(0);
}
