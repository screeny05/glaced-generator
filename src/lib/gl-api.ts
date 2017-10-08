import { promisify } from 'util';
import { join as joinPath } from 'path';
import { writeFile, mkdir } from 'fs';
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
        let tsSource = `
import * as bindings from 'bindings';

interface GLContext {
    ${mapToString(this.enums, enumValue => `
        ${Utils.enumNameToExport(enumValue.name)}: number;
    `)}

    ${mapToString(this.commands, command => `
        ${command.docs ? Utils.toBlockComment(command.docs, 4) : '    /* Docs: NOTFOUND */'}
        ${command.getTypescriptSignature()};
    `, '\n\n')}
}

const glContext: GLContext = bindings('glace');

${mapToString(this.enums, enumValue => `
    glContext.${Utils.enumNameToExport(enumValue.name)} = ${enumValue.value};
`)}

export default glContext;
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

${mapToString(this.commands, command =>
    command.getBody()
)}

void Init(napi_env env, napi_value exports, napi_value module, void* priv){
    napi_property_descriptor properties[] = {
        ${mapToString(this.commands, (command: GlCommand) => `
            DECLARE_NAPI_PROPERTY("${command.getExportName()}", napi_${command.name}),
        `)}
    };

    NAPI_CALL_RETURN_VOID(env, napi_define_properties(env, exports, ${this.commands.length}, properties));
}

NAPI_MODULE(gles, Init);

#ifdef __cplusplus
}
#endif`

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
        await copy('./template/glace.h', joinPath(folder, 'glace.h'));
        await copy('./template/deps/', joinPath(folder, 'deps'));
    }
}
