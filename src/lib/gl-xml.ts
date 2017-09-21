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
    inParams: GlCommandEntry[];
    outParams: GlCommandEntry[];

    constructor(type: string, name: string, params: GlCommandEntry[] = []){
        this.type = type;
        this.name = name;
        this.params = params;
        this.inParams = this.params.filter(param => !Utils.isOutParameter(param.type));
        this.outParams = this.params.filter(param => Utils.isOutParameter(param.type));
    }

    getBody(){
        if(this.body){
            return this.body;
        }

        if(this.outParams.length > 1){
            throw new Error(`Command ${this.name} has ${this.outParams.length} out params - please implement manually.`);
        }

        if(this.outParams.length > 0 && this.type !== 'void'){
            throw new Error(`Command ${this.name} returns a value and has an out-param - please implement manually.`);
        }

        let outParam = this.outParams[0];

        const tsSignature = this.getTypescriptSignature();

        return `
napi_value napi_${this.name}(napi_env env, napi_callback_info info){
    ${this.inParams.length > 0 ? `GET_NAPI_PARAMS_INFO(${this.inParams.length}, "${tsSignature}");` : ''}
    ${this.inParams.map((param, i) => `
    ${Utils.getCParamCall(param.type)}(${param.name}, ${i});
    `).join('')}

    ${this.outParams.map(param => `
    ${Utils.outParamTypeToDeclarationType(param.type)} ${param.name};
    `).join('')}

    ${/* void doesn't return, so we don't wrap it in a napi-return call */ ''}
    ${/* out param-functions have to return out param */ ''}
    ${this.type === 'void' || outParam ? Utils.getGlCommandCall(this) + ';' : ''}

    ${outParam ? Utils.glReturnTypeToNapiReturn(Utils.outParamTypeToDeclarationType(outParam.type)) + '(' + outParam.name + ');' : ''}

    ${outParam ? '' : `${Utils.glReturnTypeToNapiReturn(this.type)}(${this.type === 'void' ? '' : Utils.getGlCommandCall(this)});`}
}
        `;
    }

    getTypescriptSignature(){
        return `
            ${Utils.commandNameToExport(this.name)}(${this.inParams.map(param => param.name + ': ' + Utils.getTypescriptNameForCType(param.type)).join(', ')}): ${this.outParams.length > 0 ? Utils.getTypescriptNameForCType(Utils.outParamTypeToDeclarationType(this.outParams[0].type)) : Utils.getTypescriptNameForCType(this.type)}
        `.trim();
    }
}
