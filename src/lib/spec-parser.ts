import { promisify } from 'util';
import { join as joinPath, extname as getExtension } from 'path';
import { readFile, readdir } from 'fs';

import * as Utils from './napi-utils';
import { GlCommandEntry, GlEnum, GlCommand } from './gl-xml';
import GlApi from './gl-api';

export interface GlSpecParserGenerateOptions {
    api: string;
    version: string;
    source: string;
    target: string;
}

export interface GlSpecParserListOptions {
    source: string;
}

export default class GlSpecParser {
    specifications: Map<string, any> = new Map();
    documentations: Map<string, any> = new Map();
    prewrittenFunctions: Map<string, { cc: string, dts?: string }> = new Map();

    usedSpec: any;

    api: GlApi = new GlApi();

    constructor(api: string, version: string){
        this.api.api = api;
        this.api.version = version;
    }

    static async parseXmlFolder(foldername: string, map: Map<string, any>, throws: boolean = false){
        const files = await promisify(readdir)(foldername);
        await Promise.all(files.map(async file => {
            if(getExtension(file) !== '.xml'){
                return;
            }

            try {
                map.set(file, await Utils.parseXmlFile(joinPath(foldername, file)));
            } catch(e) {
                const msg = 'Unable to parse file ' + file + '\n' + e.message + '\n';
                if(throws){ throw new Error(msg); }
                console.warn(msg);
            }
        }));
    }

    async parseSpecFolder(foldername: string){
        await GlSpecParser.parseXmlFolder(foldername, this.specifications);
        this.api.revision = await promisify(readFile)(joinPath(foldername, 'revision'), 'utf8');
    }

    async parseDocFolder(foldername: string){
        await GlSpecParser.parseXmlFolder(foldername, this.documentations, false);
    }

    async loadPrewrittenFunctions(folder: string){
        const files = await promisify(readdir)(folder);
        await Promise.all(files.map(async (filename: string) => {
            if(filename.indexOf('.cc') !== filename.length - 3){
                return;
            }

            const glFnName = filename.replace(/\.cc$/, '')
            const hasTsDefinition = files.indexOf(glFnName + '.d.ts') !== -1;
            const cc = await promisify(readFile)(joinPath(folder, filename), 'utf8');
            let dts;


            if(!hasTsDefinition){
                console.warn('no typescript definition for prewritten function ' + glFnName);
            } else {
                dts = (await promisify(readFile)(joinPath(folder, glFnName + '.d.ts'), 'utf8')).trim();
            }

            this.prewrittenFunctions.set(glFnName, { cc, dts });
        }));
    }

    buildApi(){
        this.findRequiredApiFeatures();
        this.findRequiredApiEnums();
        this.findRequiredApiCommands();
        this.findRequiredTypeDefinitions();

        this.buildCommandDocs();
    }

    isApiCommandWhitelisted(name: string): boolean {
        return true;
        // TODO: check GET_NAPI_PARAM_ARRAY_
        /*return [
            // return GL_ACTIVE_INFO
            'glGetActiveAttrib',
            'glGetActiveUniform',

            // array with size
            'glGetAttachedShaders',

            // string with size
            'glGetProgramInfoLog',
            'glGetShaderInfoLog',

            // custom object
            'glGetShaderPrecisionFormat',

            // weirdness
            'glGetShaderSource',
            'glShaderSource',
            'glClientWaitSync',
            'glDeleteSync',

            // void* as gluint
            'glGetVertexAttribPointerv',
        ].indexOf(name) === -1;*/
    }

    findRequiredApiFeatures(){
        this.specifications.forEach((spec, specName) => {
            spec.registry.feature.forEach(feature => {
                if(!feature.require || !this.api.satisfiesVersionRequirement(feature.$.api, feature.$.number)){ return; }
                this.usedSpec = spec;

                feature.require.forEach(require => {
                    if(require.enum){
                        require.enum.forEach(requiredEnum => this.api.requiredEnumsNames.push(requiredEnum.$.name))
                    }
                    if(require.command){
                        require.command.forEach(requiredCommand => {
                            const { name } = requiredCommand.$;

                            if(!this.isApiCommandWhitelisted(name)){ return; }

                            this.api.requiredCommandsNames.push(name);
                        });
                    }
                });
            });
        });

        if(this.api.isEmpty()){
            throw new Error('Required API has no required Enums or Commands.');
        }
    }

    findRequiredApiEnums(){
        this.specifications.forEach(spec => {
            spec.registry.enums.forEach(enumCollection => {
                if(!enumCollection.enum){ return; }
                enumCollection.enum.forEach(enumValue => {
                    const { name, value } = enumValue.$;

                    // discard if not required
                    if(this.api.requiredEnumsNames.indexOf(name) === -1){ return; }

                    this.api.enums.push({ name, value });
                });
            });
        });

        if(!this.api.containsAllRequiredEnums()){
            throw new Error('Couldn\'t find all required enums.');
        }
    }

    findRequiredApiCommands(){
        this.specifications.forEach(spec => {
            spec.registry.commands.forEach(commandCollection => {
                if(!commandCollection.command){ return; }
                commandCollection.command.forEach(command => {
                    const { name, type } = Utils.parseCommandEntry(command.proto[0]);
                    const params: any[] = [];

                    // discard if not required
                    if(this.api.requiredCommandsNames.indexOf(name) === -1){ return; }

                    const glCommand: GlCommand = new GlCommand(name, type);

                    if(command.param){
                        command.param.forEach(param => {
                            params.push(Utils.parseParamEntry(param, glCommand));
                        });
                    }

                    glCommand.setParameters(params);

                    const prewrittenFunction = this.prewrittenFunctions.get(name);
                    if(prewrittenFunction){
                        glCommand.body = prewrittenFunction.cc;
                        glCommand.overrideTsSignature = prewrittenFunction.dts;
                    }

                    this.api.commands.push(glCommand);
                });
            });
        });

        if(!this.api.containsAllRequiredCommands()){
            throw new Error('Couldn\'t find all required commands, missing:\n' + this.api.getMissingRequiredCommands().join(', ') + '\nfound:\n' + this.api.commands.map(cmd => cmd.name).join(', '));
        }
    }

    findRequiredTypeDefinitions(){
        this.usedSpec.registry.types[0].type.forEach(typedef => {
            // reject these
            if(typedef.$ && typedef.$.api){
                return;
            }

            // these require special handling on osx
            if(typedef.$ && typedef.$.requires === 'stddef'){
                const orgDef = Utils.flattenXmlSectToString(typedef);
                const name = typedef.name[0]._;
                this.api.typeDefinitions.push(`
#if defined(__ENVIRONMENT_MAC_OS_X_VERSION_MIN_REQUIRED__) && (__ENVIRONMENT_MAC_OS_X_VERSION_MIN_REQUIRED__ > 1060)
typedef long ${name};
#else
${orgDef}
#endif
                `.trim());
                return;
            }

            this.api.typeDefinitions.push(Utils.flattenXmlSectToString(typedef));
        });
    }

    buildCommandDocs(){
        const commandDocs: Map<string, string> = new Map();

        this.documentations.forEach((doc, name) => {
            if(!doc.refentry.refsynopsisdiv){
                return;
            }

            const descriptionSect = Utils.findXmlSectionById(doc.refentry.refsect1, 'description');

            if(!descriptionSect){
                return;
            }

            const descriptionString = Utils.glDocToFunctionDoc(descriptionSect);

            doc.refentry.refsynopsisdiv[0].funcsynopsis.forEach(({ funcprototype }) => {
                funcprototype.forEach(({ funcdef }) => {
                    const commandName = funcdef[0].function[0]._;
                    commandDocs.set(commandName, descriptionString);
                });
            });
        });

        // match command docs to commands in api
        commandDocs.forEach((doc, commandName) => {
            const command = this.api.commands.find(({ name }) => name === commandName);
            if(!command || command.docs){
                return;
            }
            command.docs = doc;
        });
    }

    static async generateBindings(options: GlSpecParserGenerateOptions): Promise<void> {
        const parser = new GlSpecParser(options.api, options.version);

        await parser.parseSpecFolder(joinPath(options.source, 'spec'));
        await parser.parseDocFolder(joinPath(options.source, 'doc'));
        await parser.loadPrewrittenFunctions('./template/functions');

        parser.buildApi();

        await parser.api.generateFiles(options.target);
    }

    static async getPossibleApis(options: GlSpecParserListOptions): Promise<string[]> {
        const specs = new Map<string, any>();
        const apis: string[] = [];
        await GlSpecParser.parseXmlFolder(joinPath(options.source, 'spec'), specs);

        specs.forEach(spec => {
            spec.registry.feature.forEach(feature => {
                apis.push(feature.$.api + ' ' + feature.$.number);
            });
        });
        return apis;
    }
}
