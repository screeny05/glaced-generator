import GlSpecParser from './lib/spec-parser';
import { downloadSvnDirectory } from './lib/svn';

import * as program from 'commander';
import * as mkdirp from 'mkdirp';

import { readFileSync } from 'fs';
import { join as joinPath } from 'path';
import { promisify } from 'util';

const packageInfo = JSON.parse(readFileSync(__dirname + '/../package.json', 'utf8'));

program
    .version(packageInfo.version)
    .usage('command [arguments]');

program
    .command('download')
    .option('-t --target <folder>', 'Target folder for XML files.', './data')
    .description('Downloads specification and documentation XML files')
    .action(async ({ target }) => {
        await downloadSvnDirectory('https://cvs.khronos.org/svn/repos/ogl/trunk/doc/registry/public/api', /^(gl|glx|egl|wgl)\.xml$/, joinPath(target, 'spec'), true);
        await downloadSvnDirectory('https://cvs.khronos.org/svn/repos/ogl/trunk/ecosystem/public/sdk/docs/man2', /^[ew]?gl[^u_].*\.xml$/, joinPath(target, 'doc'));
        await downloadSvnDirectory('https://cvs.khronos.org/svn/repos/ogl/trunk/ecosystem/public/sdk/docs/man3', /^[ew]?gl[^u_].*\.xml$/, joinPath(target, 'doc'));
        await downloadSvnDirectory('https://cvs.khronos.org/svn/repos/ogl/trunk/ecosystem/public/sdk/docs/man4', /^[ew]?gl[^u_].*\.xml$/, joinPath(target, 'doc'));
    });

program
    .command('generate')
    .description('Generate natvie bindings for the given API')
    .option('-a --api <gles1|gles2|glsc2|gl|egl|glx|wgl>', 'API to generate bindings for.', /^(gles1|gles2|glsc2|gl|egl|glx|wgl)$/, 'gles2')
    .option('-v --version <version>', 'Minimum required version.', '2.0')
    .option('-s --source <folder>', 'Folder containing the XML files.', './data')
    .option('-t --target <folder>', 'Target folder for generated bindings.', './target')
    .description('Generates bindings')
    .action(options => GlSpecParser.generateBindings(options));

program
    .command('ls')
    .description('List all possible bindings and versions')
    .option('-s --source <folder>', 'Folder containing the XML files.', './data')
    .action(async (options) => console.log((await GlSpecParser.getPossibleApis(options)).join('\n')));

program.parse(process.argv);
