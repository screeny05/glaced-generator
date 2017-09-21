import generateBindings from './generate';
import { downloadSvnDirectory } from './lib/svn';

import * as program from 'commander';

import { readFileSync } from 'fs';

const packageInfo = JSON.parse(readFileSync(__dirname + '/../package.json', 'utf8'));

program
    .version(packageInfo.version)
    .usage('command [arguments]');

program
    .command('download')
    .description('Downloads specification and documentation XML files')
    .action(async () => {
        await downloadSvnDirectory('https://cvs.khronos.org/svn/repos/ogl/trunk/doc/registry/public/api', /^(gl|glx|egl|wgl)\.xml$/, './data/spec');
        await downloadSvnDirectory('https://cvs.khronos.org/svn/repos/ogl/trunk/ecosystem/public/sdk/docs/man2', /^[ew]?gl[^u_].*\.xml$/, './data/doc');
        await downloadSvnDirectory('https://cvs.khronos.org/svn/repos/ogl/trunk/ecosystem/public/sdk/docs/man3', /^[ew]?gl[^u_].*\.xml$/, './data/doc');
        await downloadSvnDirectory('https://cvs.khronos.org/svn/repos/ogl/trunk/ecosystem/public/sdk/docs/man4', /^[ew]?gl[^u_].*\.xml$/, './data/doc');
        console.log('complete');
    });

program
    .command('generate')
    .description('Generates bindings')
    .action(() => generateBindings());


program.parse(process.argv);
