#! /usr/bin/env node
const util = require('util'); // eslint-disable-line unicorn/import-style
const execFile = util.promisify(require('child_process').execFile);

const semverParse = require('semver/functions/parse');

const pkg = require('../package.json');

/**
 * Runs command and logs all output
 */
async function runGitCmd(args) {
  // Promise-based approach grabbed from here: https://stackoverflow.com/a/63027900
  const execCmd = execFile('git', args);
  const child = execCmd.child;

  child.stdout.on('data', chunk => {
    // eslint-disable-next-line no-console
    console.log(chunk.toString());
  });

  child.stderr.on('data', chunk => {
    // eslint-disable-next-line no-console
    console.error(chunk.toString());
  });

  await execCmd;
}

/**
 * Sets major git tag as part of release process
 *
 * @example v7
 */
async function setMajorVersionTag() {
  try {
    const parsedVersion = semverParse(pkg.version);

    if (parsedVersion.prerelease.length) {
      // eslint-disable-next-line no-console
      console.warn('Pre-release version, not setting major version tag');
      return;
    }

    const majorTag = `v${parsedVersion.major}`;

    await runGitCmd(['tag', majorTag, '--force', '--message', `Top-level tag pointing to ${parsedVersion.version}`]);

    const args = process.argv.slice(2);

    if (args[0] === 'push') {
      await runGitCmd(['push', 'origin', majorTag, '--force']);
      // eslint-disable-next-line no-console
      console.log(`🏷️  Created and pushed ${majorTag}`);
    } else {
      // eslint-disable-next-line no-console
      console.log("Not pushing, missing 'push' argument");
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error running git major version tagging script!');
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }
}

setMajorVersionTag();
