import { promisify } from 'util';
import { join as joinPath } from 'path';
import { readFile, writeFile, mkdir } from 'fs';
import * as copy from 'recursive-copy';
import * as rimraf from 'rimraf';
import { format as formatTs } from 'prettier';

import * as Utils from './napi-utils';
import { GlCommandEntry, GlEnum, GlCommand } from './gl-xml';
import { formatCode as formatC } from './clang-format';
import { mapToString } from './string-utils';

export default class GlApi {
    api: string;
    version: string;
    revision: string;

    requiredEnumsNames: string[] = [];
    requiredCommandsNames: string[] = [];

    enums: GlEnum[] = [];
    commands: GlCommand[] = [];
    typeDefinitions: string[] = [];

    isEmpty(): boolean {
        return this.requiredEnumsNames.length === 0 && this.requiredCommandsNames.length === 0;
    }

    satisfiesVersionRequirement(givenApi: string, givenVersion: string): boolean {
        return Utils.satisfiesVersionRequirement(this.api, this.version, givenApi, givenVersion);
    }

    containsAllRequiredEnums(): boolean {
        return !this.requiredEnumsNames.find(name => !this.enums.find(enumObj => enumObj.name === name));
    }

    containsAllRequiredCommands(): boolean {
        return !this.requiredCommandsNames.find(name => !this.commands.find(command => command.name === name));
    }

    getMissingRequiredCommands(): string[] {
        return this.requiredCommandsNames.filter(name => !this.commands.find(command => command.name === name));
    }

    async generateFiles(folder: string){
        const glacePackageInfo = JSON.parse(await promisify(readFile)('./package.json'));
        const glContextName = this.api.toUpperCase() + 'Context';

        let tsSource = `
import * as bindings from 'bindings';

export interface ${glContextName} {
    bindingsApi: string;
    bindingsVersion: string;
    bindingsRevision: number;

    ${mapToString(this.enums, enumValue => `
        ${Utils.enumNameToExport(enumValue.name)}: number;
    `)}

    ${mapToString(this.commands, command => `
        ${command.docs ? Utils.toBlockComment(command.docs, 4) : '    /* Docs: NOTFOUND */'}
        ${command.getTypescriptSignature()};
    `, '\n\n')}
}

export const glContext: ${glContextName} = bindings('glace');

glContext.bindingsApi = '${this.api}';
glContext.bindingsVersion = '${this.version}';
glContext.bindingsRevision = ${this.revision};

${mapToString(this.enums, enumValue => `
    glContext.${Utils.enumNameToExport(enumValue.name)} = ${enumValue.value};
`)}
        `;

        // https://www.khronos.org/opengl/wiki/Load_OpenGL_Functions
        let cSource = `
#include <iostream>
#include <node_api.h>

#define GLFW_INCLUDE_NONE

#ifndef APIENTRY
#define APIENTRY
#endif
#ifndef APIENTRYP
#define APIENTRYP APIENTRY *
#endif


${this.typeDefinitions.join('\n')}

// prevent name wrangling
#ifdef __cplusplus
extern "C" {
#endif

#include <common.h>
#include <scn_napi.h>
#include "glace.h"

// opengl constants
${this.enums.map(entry => `#define ${entry.name} ${entry.value}`).join('\n')}

// define fn pointers
${mapToString(this.commands, (command: GlCommand) => command.getProcTypedef())}

// create globals for functions
${mapToString(this.commands, (command: GlCommand) => `${command.getGlPfnName()} ${command.name};`)}

// load gl functions
void glaceLoadGl(GLACEloadproc load){
    ${mapToString(this.commands, (command: GlCommand) => `
        ${command.name} = (${command.getGlPfnName()})load("${command.name}");
    `)}
}

napi_env _env;
napi_value _loadproc;

void* loadprocProxy(const char *name) {
    int64_t value;
    napi_value arg;
    napi_value resultValue;
    napi_value global;

    NAPI_CALL(_env, napi_get_global(_env, &global));
    NAPI_CALL_BASE(_env, napi_create_string_utf8(_env, name, -1, &arg), 0);

    napi_value* argv = &arg;
    NAPI_CALL_BASE(_env, napi_call_function(_env, global, _loadproc, 1, argv, &resultValue), 0);

    NAPI_CALL_BASE(_env, napi_get_value_int64(_env, resultValue, &value), 0);
    return (void *)value;
}

napi_value napi_glaceLoadGl(napi_env env, napi_callback_info info) {
    GET_NAPI_PARAMS_INFO(1, "glaceLoadGl(loadproc: (name: string) => number): void");
    GET_NAPI_PARAM_FUNCTION(loadproc, 0);

    _env = env;
    _loadproc = loadproc;

    glaceLoadGl((GLACEloadproc)loadprocProxy);

    _env = NULL;
    _loadproc = NULL;

    RETURN_NAPI_UNDEFINED();
}

${mapToString(this.commands, command => command.getBody())}

void Init(napi_env env, napi_value exports, napi_value module, void* priv){
    napi_property_descriptor properties[] = {
        DECLARE_NAPI_PROPERTY("glaceLoadGl", napi_glaceLoadGl),
        ${mapToString(this.commands, (command: GlCommand) => `
            DECLARE_NAPI_PROPERTY("${command.getExportName()}", napi_${command.name}),
        `)}
    };

    NAPI_CALL_RETURN_VOID(env, napi_define_properties(env, exports, ${this.commands.length + 1}, properties));
}

NAPI_MODULE(gles, Init);

#ifdef __cplusplus
}
#endif`;

        const packageJsonSource = JSON.stringify({
            name: 'node-glace-' + this.api + '-' + this.version,
            version: glacePackageInfo.version + '-' + this.revision,
            author: glacePackageInfo.author,
            license: glacePackageInfo.license,
            main: 'dist/glace.js',
            dependencies: {
                bindings: glacePackageInfo.dependencies.bindings
            },
            devDependencies: {
                typescript: glacePackageInfo.dependencies.typescript
            },
            scripts: {
                build: 'node-gyp build && tsc'
            },
            types: './glace.d.ts',
        }, null, '    ');

        const tsConfigSource = JSON.stringify({
            compilerOptions: {
                module: 'commonjs',
                target: 'ES2017',
                outDir: 'dist',
                sourceMap: true
            },
            exclude: ['node_modules']
        }, null, '    ');

        // format c source with clang
        cSource = await formatC(cSource);

        // format ts source with prettier
        tsSource = formatTs(tsSource, {
            printWidth: Infinity,
            tabWidth: 4,
            singleQuote: true,
        });


        await promisify(rimraf)(folder);
        await promisify(mkdir)(folder);
        await promisify(writeFile)(joinPath(folder, 'glace.ts'), tsSource, 'utf8');
        await promisify(writeFile)(joinPath(folder, 'glace.cc'), cSource, 'utf8');
        await promisify(writeFile)(joinPath(folder, 'package.json'), packageJsonSource, 'utf8');
        await promisify(writeFile)(joinPath(folder, 'tsconfig.json'), tsConfigSource, 'utf8');
        await copy('./template/glace.h', joinPath(folder, 'glace.h'));
        await copy('./template/deps/', joinPath(folder, 'deps'));
    }
}
