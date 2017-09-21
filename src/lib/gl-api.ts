import { promisify } from 'util';
import { join as joinPath } from 'path';
import { writeFile, mkdir } from 'fs';
import * as copy from 'recursive-copy';
import * as rimraf from 'rimraf';

import * as Utils from './napi-utils';
import { GlCommandEntry, GlEnum, GlCommand } from './gl-xml';

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

    async generateFiles(folder){
        const tsSource = `
import * as bindings from 'bindings';

interface GLContext {
${this.enums.map(enumValue => `
    ${Utils.enumNameToExport(enumValue.name)}: number;`
).join('')}

${this.commands.map(command => `
${command.docs ? Utils.toBlockComment(command.docs, 4) : '    /* Docs: TODO */'}
    ${command.getTypescriptSignature()};
`
).join('')}
}

const glContext: GLContext = bindings('glace');

${this.enums.map(enumValue => `
glContext.${Utils.enumNameToExport(enumValue.name)} = ${enumValue.value};`
).join('')}

export default glContext;
        `.trim();

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

#include <common.h>
#include <scn_napi.h>
#include "index.h"

// define fn pointers
${this.commands.map(command => `
typedef ${command.type} (APIENTRYP ${Utils.getGlPfnName(command.name)})(${command.params.map(param => `${param.type} ${param.name}`).join(', ')});`
).join('')}

// create globals for functions
${this.commands.map(command => `
${Utils.getGlPfnName(command.name)} ${command.name};`
).join('')}

// load gl functions
void loadGlFunctions(GLACEloadproc load){
    ${this.commands.map(command => `
    ${command.name} = (${Utils.getGlPfnName(command.name)})load("${command.name}");`
    ).join('')}
}

${/*this.enums.map(entry => `#define ${entry.name} ${entry.value}`).join('\n')*/''}

${this.commands.map(command => command.getBody()).join('')}

void Init(napi_env env, napi_value exports, napi_value module, void* priv){
    napi_property_descriptor properties[] = {
        ${this.commands.map(command => `
        DECLARE_NAPI_PROPERTY("${Utils.commandNameToExport(command.name)}", napi_${command.name}),`
        ).join('')}
    };

    NAPI_CALL_RETURN_VOID(env, napi_define_properties(env, exports, ${this.commands.length}, properties));
}

NAPI_MODULE(gles, Init);`

        // remove empty lines starting with spaces (e.g. lines starting a `.map`)
        cSource = cSource.replace(/\n +\n/g, '\n');

        await promisify(rimraf)(folder);
        await promisify(mkdir)(folder);
        await promisify(writeFile)(joinPath(folder, 'index.ts'), tsSource, 'utf8');
        await promisify(writeFile)(joinPath(folder, 'index.cc'), cSource, 'utf8');
        await copy('./template/index.h', joinPath(folder, 'index.h'));
        await copy('./template/deps/', joinPath(folder, 'deps'));
    }
}
