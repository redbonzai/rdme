import CategoriesCommand from './categories';
import CategoriesCreateCommand from './categories/create';
import ChangelogsCommand from './changelogs';
import SingleChangelogCommand from './changelogs/single';
import CustomPagesCommand from './custompages';
import SingleCustomPageCommand from './custompages/single';
import DocsCommand from './docs';
import EditDocsCommand from './docs/edit';
import SingleDocCommand from './docs/single';
import LoginCommand from './login';
import LogoutCommand from './logout';
import OASCommand from './oas';
import OpenCommand from './open';
import OpenAPICommand from './openapi';
import SwaggerCommand from './swagger';
import ValidateCommand from './validate';
import VersionsCommand from './versions';
import CreateVersionCommand from './versions/create';
import DeleteVersionCommand from './versions/delete';
import UpdateVersionCommand from './versions/update';
import WhoAmICommand from './whoami';

const commands = {
  categories: CategoriesCommand,
  'categories:create': CategoriesCreateCommand,

  changelogs: ChangelogsCommand,
  'changelogs:single': SingleChangelogCommand,

  custompages: CustomPagesCommand,
  'custompages:single': SingleCustomPageCommand,

  docs: DocsCommand,
  'docs:edit': EditDocsCommand,
  'docs:single': SingleDocCommand,

  versions: VersionsCommand,
  'versions:create': CreateVersionCommand,
  'versions:delete': DeleteVersionCommand,
  'versions:update': UpdateVersionCommand,

  login: LoginCommand,
  logout: LogoutCommand,
  oas: OASCommand,
  open: OpenCommand,
  openapi: OpenAPICommand,
  swagger: SwaggerCommand,
  validate: ValidateCommand,
  whoami: WhoAmICommand,
};

export default commands;