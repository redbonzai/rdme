import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';
import frontMatter from 'gray-matter';
import nock from 'nock';
import prompts from 'prompts';
import { describe, beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';

import CustomPagesCommand from '../../../src/cmds/custompages.js';
import APIError from '../../../src/lib/apiError.js';
import getAPIMock from '../../helpers/get-api-mock.js';
import hashFileContents from '../../helpers/hash-file-contents.js';

const custompages = new CustomPagesCommand();

const fixturesBaseDir = '__fixtures__/custompages';
const fullFixturesDir = `${__dirname}./../../${fixturesBaseDir}`;
const key = 'API_KEY';

describe('rdme custompages (single)', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => nock.cleanAll());

  it('should prompt for login if no API key provided', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    prompts.inject(['this-is-not-an-email', 'password', 'subdomain']);
    await expect(custompages.run({})).rejects.toStrictEqual(new Error('You must provide a valid email address.'));
    consoleInfoSpy.mockRestore();
  });

  it('should error in CI if no API key provided', async () => {
    process.env.TEST_RDME_CI = 'true';
    await expect(custompages.run({})).rejects.toStrictEqual(
      new Error('No project API key provided. Please use `--key`.'),
    );
    delete process.env.TEST_RDME_CI;
  });

  it('should error if no file path provided', () => {
    return expect(custompages.run({ key })).rejects.toStrictEqual(
      new Error('No path provided. Usage `rdme custompages <path> [options]`.'),
    );
  });

  it('should error if the argument is not a Markdown/HTML file', () => {
    return expect(custompages.run({ key, filePath: 'package.json' })).rejects.toStrictEqual(
      new Error('Invalid file extension (.json). Must be one of the following: .html, .markdown, .md'),
    );
  });

  it('should error if file path cannot be found', () => {
    return expect(
      custompages.run({ key, version: '1.0.0', filePath: 'non-existent-file.markdown' }),
    ).rejects.toStrictEqual(new Error("Oops! We couldn't locate a file or directory at the path you provided."));
  });

  describe('new custompages', () => {
    it('should create new custom page', async () => {
      const slug = 'new-doc';
      const id = '1234';
      const doc = frontMatter(fs.readFileSync(path.join(fullFixturesDir, `/new-docs/${slug}.md`)));
      const hash = hashFileContents(fs.readFileSync(path.join(fullFixturesDir, `/new-docs/${slug}.md`)));

      const getMock = getAPIMock()
        .get(`/api/v1/custompages/${slug}`)
        .basicAuth({ user: key })
        .reply(404, {
          error: 'CUSTOMPAGE_NOTFOUND',
          message: `The custom page with the slug '${slug}' couldn't be found`,
          suggestion: '...a suggestion to resolve the issue...',
          help: 'If you need help, email support@readme.io and mention log "fake-metrics-uuid".',
        });

      const postMock = getAPIMock()
        .post('/api/v1/custompages', { slug, body: doc.content, ...doc.data, lastUpdatedHash: hash })
        .basicAuth({ user: key })
        .reply(201, { slug, _id: id, body: doc.content, ...doc.data });

      await expect(
        custompages.run({ filePath: `./__tests__/${fixturesBaseDir}/new-docs/new-doc.md`, key }),
      ).resolves.toBe(
        `🌱 successfully created 'new-doc' (ID: 1234) with contents from ./__tests__/${fixturesBaseDir}/new-docs/new-doc.md`,
      );

      getMock.done();
      postMock.done();
    });

    it('should create new HTML custom page', async () => {
      const slug = 'new-doc';
      const id = '1234';
      const doc = frontMatter(fs.readFileSync(path.join(fullFixturesDir, `/new-docs-html/${slug}.html`)));
      const hash = hashFileContents(fs.readFileSync(path.join(fullFixturesDir, `/new-docs-html/${slug}.html`)));

      const getMock = getAPIMock()
        .get(`/api/v1/custompages/${slug}`)
        .basicAuth({ user: key })
        .reply(404, {
          error: 'CUSTOMPAGE_NOTFOUND',
          message: `The custom page with the slug '${slug}' couldn't be found`,
          suggestion: '...a suggestion to resolve the issue...',
          help: 'If you need help, email support@readme.io and mention log "fake-metrics-uuid".',
        });

      const postMock = getAPIMock()
        .post('/api/v1/custompages', { slug, html: doc.content, htmlmode: true, ...doc.data, lastUpdatedHash: hash })
        .basicAuth({ user: key })
        .reply(201, { slug, _id: id, html: doc.content, htmlmode: true, ...doc.data });

      await expect(
        custompages.run({ filePath: `./__tests__/${fixturesBaseDir}/new-docs-html/new-doc.html`, key }),
      ).resolves.toBe(
        `🌱 successfully created 'new-doc' (ID: 1234) with contents from ./__tests__/${fixturesBaseDir}/new-docs-html/new-doc.html`,
      );

      getMock.done();
      postMock.done();
    });

    it('should return creation info for dry run', async () => {
      const slug = 'new-doc';
      const doc = frontMatter(fs.readFileSync(path.join(fullFixturesDir, `/new-docs/${slug}.md`)));

      const getMock = getAPIMock()
        .get(`/api/v1/custompages/${slug}`)
        .basicAuth({ user: key })
        .reply(404, {
          error: 'CUSTOMPAGE_NOTFOUND',
          message: `The custom page with the slug '${slug}' couldn't be found`,
          suggestion: '...a suggestion to resolve the issue...',
          help: 'If you need help, email support@readme.io and mention log "fake-metrics-uuid".',
        });

      await expect(
        custompages.run({ dryRun: true, filePath: `./__tests__/${fixturesBaseDir}/new-docs/new-doc.md`, key }),
      ).resolves.toBe(
        `🎭 dry run! This will create 'new-doc' with contents from ./__tests__/${fixturesBaseDir}/new-docs/new-doc.md with the following metadata: ${JSON.stringify(
          doc.data,
        )}`,
      );

      getMock.done();
    });

    it('should skip if it does not contain any front matter attributes', async () => {
      const filePath = `./__tests__/${fixturesBaseDir}/failure-docs/doc-sans-attributes.md`;

      await expect(custompages.run({ filePath, key })).resolves.toBe(
        `⏭️  no front matter attributes found for ${filePath}, skipping`,
      );
    });

    it('should fail if some other error when retrieving page slug', async () => {
      const slug = 'new-doc';

      const errorObject = {
        error: 'INTERNAL_ERROR',
        message: 'Unknown error (yikes)',
        suggestion: '...a suggestion to resolve the issue...',
        help: 'If you need help, email support@readme.io and mention log "fake-metrics-uuid".',
      };

      const getMock = getAPIMock().get(`/api/v1/custompages/${slug}`).basicAuth({ user: key }).reply(500, errorObject);

      const filePath = `./__tests__/${fixturesBaseDir}/failure-docs/${slug}.md`;

      const formattedErrorObject = {
        ...errorObject,
        message: `Error uploading ${chalk.underline(`${filePath}`)}:\n\n${errorObject.message}`,
      };

      await expect(custompages.run({ filePath, key })).rejects.toStrictEqual(new APIError(formattedErrorObject));

      getMock.done();
    });
  });

  describe('slug metadata', () => {
    it('should use provided slug', async () => {
      const slug = 'new-doc-slug';
      const id = '1234';
      const doc = frontMatter(fs.readFileSync(path.join(fullFixturesDir, `/slug-docs/${slug}.md`)));
      const hash = hashFileContents(fs.readFileSync(path.join(fullFixturesDir, `/slug-docs/${slug}.md`)));

      const getMock = getAPIMock()
        .get(`/api/v1/custompages/${doc.data.slug}`)
        .basicAuth({ user: key })
        .reply(404, {
          error: 'CUSTOMPAGE_NOTFOUND',
          message: `The custom page with the slug '${slug}' couldn't be found`,
          suggestion: '...a suggestion to resolve the issue...',
          help: 'If you need help, email support@readme.io and mention log "fake-metrics-uuid".',
        });

      const postMock = getAPIMock()
        .post('/api/v1/custompages', { slug, body: doc.content, ...doc.data, lastUpdatedHash: hash })
        .basicAuth({ user: key })
        .reply(201, { slug: doc.data.slug, _id: id, body: doc.content, ...doc.data, lastUpdatedHash: hash });

      await expect(
        custompages.run({ filePath: `./__tests__/${fixturesBaseDir}/slug-docs/new-doc-slug.md`, key }),
      ).resolves.toBe(
        `🌱 successfully created 'marc-actually-wrote-a-test' (ID: 1234) with contents from ./__tests__/${fixturesBaseDir}/slug-docs/new-doc-slug.md`,
      );

      getMock.done();
      postMock.done();
    });
  });

  describe('existing custompages', () => {
    let simpleDoc;

    beforeEach(() => {
      const fileContents = fs.readFileSync(path.join(fullFixturesDir, '/existing-docs/simple-doc.md'));
      simpleDoc = {
        slug: 'simple-doc',
        doc: frontMatter(fileContents),
        hash: hashFileContents(fileContents),
      };
    });

    it('should fetch custom page and merge with what is returned', () => {
      const getMock = getAPIMock()
        .get('/api/v1/custompages/simple-doc')
        .basicAuth({ user: key })
        .reply(200, { slug: simpleDoc.slug, lastUpdatedHash: 'anOldHash' });

      const updateMock = getAPIMock()
        .put('/api/v1/custompages/simple-doc', {
          body: simpleDoc.doc.content,
          htmlmode: false,
          lastUpdatedHash: simpleDoc.hash,
          ...simpleDoc.doc.data,
        })
        .basicAuth({ user: key })
        .reply(200, {
          slug: simpleDoc.slug,
          body: simpleDoc.doc.content,
          htmlmode: false,
        });

      return custompages
        .run({ filePath: `./__tests__/${fixturesBaseDir}/existing-docs/simple-doc.md`, key })
        .then(updatedDocs => {
          expect(updatedDocs).toBe(
            `✏️ successfully updated 'simple-doc' with contents from ./__tests__/${fixturesBaseDir}/existing-docs/simple-doc.md`,
          );

          getMock.done();
          updateMock.done();
        });
    });

    it('should return custom page update info for dry run', () => {
      expect.assertions(1);

      const getMock = getAPIMock()
        .get('/api/v1/custompages/simple-doc')
        .basicAuth({ user: key })
        .reply(200, { slug: simpleDoc.slug, lastUpdatedHash: 'anOldHash' });

      return custompages
        .run({ dryRun: true, filePath: `./__tests__/${fixturesBaseDir}/existing-docs/simple-doc.md`, key })
        .then(updatedDocs => {
          // All custompages should have been updated because their hashes from the GET request were different from what they
          // are currently.
          expect(updatedDocs).toBe(
            [
              `🎭 dry run! This will update 'simple-doc' with contents from ./__tests__/${fixturesBaseDir}/existing-docs/simple-doc.md with the following metadata: ${JSON.stringify(
                simpleDoc.doc.data,
              )}`,
            ].join('\n'),
          );

          getMock.done();
        });
    });

    it('should not send requests for custompages that have not changed', () => {
      expect.assertions(1);

      const getMock = getAPIMock()
        .get('/api/v1/custompages/simple-doc')
        .basicAuth({ user: key })
        .reply(200, { slug: simpleDoc.slug, lastUpdatedHash: simpleDoc.hash });

      return custompages
        .run({ filePath: `./__tests__/${fixturesBaseDir}/existing-docs/simple-doc.md`, key })
        .then(skippedDocs => {
          expect(skippedDocs).toBe('`simple-doc` was not updated because there were no changes.');

          getMock.done();
        });
    });

    it('should adjust "no changes" message if in dry run', () => {
      const getMock = getAPIMock()
        .get('/api/v1/custompages/simple-doc')
        .basicAuth({ user: key })
        .reply(200, { slug: simpleDoc.slug, lastUpdatedHash: simpleDoc.hash });

      return custompages
        .run({ dryRun: true, filePath: `./__tests__/${fixturesBaseDir}/existing-docs/simple-doc.md`, key })
        .then(skippedDocs => {
          expect(skippedDocs).toBe('🎭 dry run! `simple-doc` will not be updated because there were no changes.');

          getMock.done();
        });
    });
  });
});
