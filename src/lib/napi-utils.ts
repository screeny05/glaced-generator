import { promisify } from 'util';
import { parseString as parseXmlString } from 'xml2js';
import { join as joinPath } from 'path';
import { readFile } from 'fs';
import * as wordwrap from 'wordwrap';

import { GlCommandEntry, GlEnum, GlCommand } from './gl-xml';

export function parseNameTypePair(entry: any): { name: string, type: string } {
    const name: string = entry.name[0]._.trim();
    const type: string = entry.$$
        .filter(children => children['#name'] !== 'name')
        .map(children => children._)
        .join('')
        .trim();

    return { name, type };
}

export function parseCommandEntry(entry: any): GlCommandEntry {
    const { name, type } = parseNameTypePair(entry);
    return new GlCommandEntry(name, type);
}

export function parseParamEntry(entry: any, command: GlCommand): GlCommandEntry {
    const { name, type } = parseNameTypePair(entry);

    const paramHint = command.hints && command.hints.params && command.hints.params[name];
    let length: string | number | undefined = entry.$ && entry.$.len;
    let forceOutparam: boolean | undefined = undefined;

    if(paramHint && paramHint.len){
        length = paramHint.len;
    }

    if(paramHint && typeof paramHint.isOutType !== 'undefined'){
        forceOutparam = paramHint.isOutType;
    }

    return new GlCommandEntry(name, type, {
        forceOutparam,
        length
    });
}

export function enumNameToExport(name: string): string {
    return name.replace(/^GL_/, '').replace(/^[0-9]/, '_$&');
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
