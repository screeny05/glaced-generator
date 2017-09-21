import { promisify } from 'util';
import { parseString as parseXmlString } from 'xml2js';
import { join as joinPath } from 'path';
import { readFile } from 'fs';
import * as wordwrap from 'wordwrap';


import { GlCommandEntry, GlEnum, GlCommand } from './gl-xml';

export function isOutParameter(type: string): boolean {
    return [
        'GLboolean *',
        'GLfloat *',
        'GLint *',
        //'GLuint *',
        //'GLsizei *',
    ].indexOf(type) !== -1;
}

export function outParamTypeToDeclarationType(type: string): string {
    // TODO: probably not sufficient
    return type.replace(' *', '');
}

export function outParamTypeToPointerArgument(type: string): string {
    // TODO: probably not sufficient
    return '&' + outParamTypeToDeclarationType(type);
}

export function hasCommandOutParameters(command: GlCommand): boolean {
    return !!command.params.find(param => isOutParameter(param.type));
}

export function parseCommandEntry(entry: any): GlCommandEntry {
    const name = entry.name[0]._.trim();
    const type = entry.$$
        .filter(children => children['#name'] !== 'name')
        .map(children => children._)
        .join('')
        .trim();

    return { type, name };
}

export function enumNameToExport(name: string): string {
    return name.replace(/^GL_/, '').replace(/^[0-9]/, '_$&');
}

export function commandNameToExport(name: string): string {
    return name.replace(/^gl(\w)/, (match, group0) => group0.toLowerCase());
}

export function flattenXmlSectToString(xmlEntry, transformator: (sect: any, parent: any) => string = (e) => e._, trimDown: boolean = false): string {
    if(!xmlEntry || !xmlEntry.$$){
        return '';
    }

    let flattened = xmlEntry.$$.map(entry => {
        if(entry.$$){
            return flattenXmlSectToString(entry);
        }
        if(!entry._){
            return '';
        }
        return transformator(entry, xmlEntry);
    }).join('');

    if(!trimDown){
        return flattened;
    }

    return flattened.replace(/\s+/g, ' ').replace(/\s(\.|,|\))(\s|$)/g, '$1 ').trim();
}

export function glDocToFunctionDoc(sect): string {
    return flattenXmlSectToString(sect.para[0], (entry, parent) => {
        return [
            'parameter',
            'function',
            'constant',
            'refentrytitle'
        ].indexOf(parent['#name']) ? '*' + entry._ + '*' : entry._;
    }, true);
}

export function findXmlSectionById(sects, id: string): any {
    return sects.find(({ $ }) => $.id === 'description' || $['xml:id'] === 'description');
}

export function toBlockComment(comment: string, indentation: number): string {
    const padLeft = ' '.repeat(indentation);
    comment = wordwrap(80)(comment);

    return padLeft + '/**\n' + padLeft + ' * ' + comment.split('\n').join('\n' + padLeft + ' * ') + '\n' + padLeft + ' */';
}

export async function parseXmlFile(filename: string){
    const contents = await promisify(readFile)(joinPath(filename), 'utf8');

    return await promisify(parseXmlString)(contents, {
        explicitChildren: true,
        charsAsChildren: true,
        preserveChildrenOrder: true,
        normalizeTags: true,
        attrNameProcessors: [attr => attr.toLowerCase()],

        // ignore mathml entities
        strict: false
    });
}

export function satisfiesVersionRequirement(requiredApi: string, requiredVersion: string, givenApi: string, givenVersion: string): boolean {
    return requiredApi.toLowerCase() === givenApi.toLowerCase() && parseFloat(givenVersion) <= parseFloat(requiredVersion);
}

export function glReturnTypeToNapiReturn(type: string): string {
    switch(type){
        case 'void':
            return 'RETURN_NAPI_UNDEFINED';
        case 'GLboolean':
            return 'RETURN_NAPI_BOOL';
        case 'const GLchar *':
        case 'const GLubyte *':
            return 'RETURN_NAPI_STRING';
        case 'GLint':
        case 'GLenum':
        case 'GLuint':
        case 'GLfloat':
            return 'RETURN_NAPI_NUMBER';
        case 'GLsync':
        case 'void *':
            return '// TODO - ' + type;
        default:
            throw new TypeError(`Unknown return type '${type}'`);
    }
}

export function getGlPfnName(name: string): string {
    return 'PFN' + name.replace('_', '').toUpperCase() + 'PROC';
}

export function getTypescriptNameForCType(ctype: string): string {
    switch(ctype){
        case 'void':
            return 'void';
        case 'GLenum':
        case 'GLint':
        case 'GLsizei':
        case 'GLsizeiptr':
        case 'GLintptr':
        case 'GLuint':
        case 'GLfloat':
        case 'GLbitfield':
        case 'GLbyte':
        case 'GLubyte':
        case 'GLshort':
        case 'GLushort':
        case 'GLdouble':
        case 'GLuint64':
            return 'number';
        case 'GLboolean':
            return 'boolean';
        case 'const GLchar *':
            return 'string';
        case 'const void *':
            return 'ArrayBufferView | ArrayBuffer'
        case 'const GLfloat *':
            return 'Float32Array';
        case 'const GLint *':
            return 'Int32Array';
        case 'const GLuint *':
        case 'const GLsizei *':
        case 'const GLintptr *':
        case 'const GLsizeiptr *':
        case 'const GLenum *':
        case 'const GLdouble *':
        case 'const GLubyte *':
        case 'const GLbyte *':
        case 'const GLshort *':
        case 'const GLushort *':
            return 'number[]';
        case 'const GLboolean *':
            return 'boolean[]';
        default:
            return 'any';
    }
}

export function getGlCommandCall(command: GlCommand): string {
    return command.name + '(' + command.params.map(param => isOutParameter(param.type) ? outParamTypeToPointerArgument(param.name) : param.name).join(', ') + ')';
}

export function getCParamCall(paramType: string): string {
    switch(paramType){
        case 'GLint':
        case 'GLsizei':
        case 'GLintptr':
        case 'GLsizeiptr':
            return 'GET_NAPI_PARAM_INT32';
        case 'GLboolean':
            return 'GET_NAPI_PARAM_BOOL';
        case 'GLenum':
            return 'GET_NAPI_PARAM_GLENUM';
        case 'GLuint':
            return 'GET_NAPI_PARAM_GLUINT';
        case 'GLbyte':
            return 'GET_NAPI_PARAM_INT8';
        case 'GLubyte':
            return 'GET_NAPI_PARAM_UINT8';
        case 'GLshort':
            return 'GET_NAPI_PARAM_INT16';
        case 'GLushort':
            return 'GET_NAPI_PARAM_UINT16';
        case 'GLfloat':
            return 'GET_NAPI_PARAM_FLOAT';
        case 'GLdouble':
            return 'GET_NAPI_PARAM_DOUBLE';
        case 'GLuint64':
            return 'GET_NAPI_PARAM_UINT64';
        case 'const GLchar *':
            return 'GET_NAPI_PARAM_STRING';
        case 'const void *':
            return 'GET_NAPI_PARAM_ARRAY_BUFFER';
        case 'GLbitfield':
            return 'GET_NAPI_PARAM_UINT32';
        case 'const GLint *':
            return 'GET_NAPI_PARAM_TYPED_ARRAY_INT32';
        case 'const GLuint *':
        case 'const GLenum *':
            return 'GET_NAPI_PARAM_ARRAY_UINT32';
        case 'const GLfloat *':
            return 'GET_NAPI_PARAM_TYPED_ARRAY_FLOAT32';
        case 'const GLdouble *':
            return 'GET_NAPI_PARAM_ARRAY_DOUBLE';
        case 'const GLubyte *':
            return 'GET_NAPI_PARAM_ARRAY_UINT8';
        case 'const GLbyte *':
            return 'GET_NAPI_PARAM_ARRAY_INT8';
        case 'const GLshort *':
            return 'GET_NAPI_PARAM_ARRAY_INT16';
        case 'const GLushort *':
            return 'GET_NAPI_PARAM_ARRAY_UINT16';
        case 'const GLboolean *':
            return 'GET_NAPI_PARAM_ARRAY_BOOL';

        case 'const GLsizei *':
        case 'const GLintptr *':
        case 'const GLsizeiptr *':
            throw new TypeError(`Type ${paramType} should be checked before using 'GET_NAPI_PARAM_TYPED_ARRAY_INT32' (also update getTypescriptNameForCType)`);
        case 'const GLchar *const*':
        case 'const void *const*':
        case 'void *':
        case 'void **':
        case 'GLfloat *':
        case 'GLdouble *':
        case 'GLushort *':
        case 'GLubyte *':
        case 'GLboolean *':
        case 'GLchar *':
        case 'GLenum *':
        case 'GLint *':
        case 'GLuint *':
        case 'GLsizei *':
        case 'GLint64 *':
        case 'GLuint64 *':
        case 'GLsync':
        case 'GLDEBUGPROC':
            throw new TypeError(`Type ${paramType} is out-type - custom handling has to be implemented.`);
        default:
            throw new TypeError(`Type '${paramType}' unknown - no CParamCall found.`);
    }
}
