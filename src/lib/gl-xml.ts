import * as Utils from './napi-utils';

export interface GlEnum {
    docs?: string,
    name: string,
    value: number
};

export interface GlCommandEntry {
    type: string,
    name: string
};

export class GlCommand implements GlCommandEntry {
    type: string;
    name: string;
    body?: string;
    docs?: string;
    params: GlCommandEntry[];

    constructor(type: string, name: string, params: GlCommandEntry[] = []){
        this.type = type;
        this.name = name;
        this.params = params;
    }

    getBody(){
        if(this.body){
            return this.body;
        }

        const tsSignature = this.getTypescriptSignature();


        return `
napi_value napi_${this.name}(napi_env env, napi_callback_info info){
    ${this.params.length > 0 ? `GET_NAPI_PARAMS_INFO(${this.params.length}, "${tsSignature}");` : ''}
    ${this.params.map((param, i) => `
    ${Utils.getCParamCall(param.type)}(${param.name}, ${i});
    `).join('')}

    ${/* void doesn't return, so we don't wrap it in a napi-return call */ ''}
    ${this.type === 'void' ? Utils.getGlCommandCall(this) + ';' : ''}
    ${Utils.glReturnTypeToNapiReturn(this.type)}(${this.type === 'void' ? '' : Utils.getGlCommandCall(this)});
}
        `;
    }

    getTypescriptSignature(){
        return `
            ${Utils.commandNameToExport(this.name)}(${this.params.map(param => param.name + ': ' + Utils.getTypescriptNameForCType(param.type)).join(', ')}): ${Utils.getTypescriptNameForCType(this.type)}
        `.trim();
    }
}
