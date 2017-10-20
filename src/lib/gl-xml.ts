import * as Utils from './napi-utils';
import { nativeTypeCollection, NativeType } from './type-matcher';
import { NativeHintsCommand, nativeHintsCommands } from './native-hints';

export interface GlEnum {
    docs?: string;
    name: string;
    value: number;
}

export class GlCommandEntry {
    type: NativeType;
    name: string;
    length?: number | string;
    isSynthetic: boolean = false;
    forceOutparam?: boolean;
    isReplacedWithLocal: boolean = false;
    glCallString?: string;

    constructor(name: string, type: NativeType | string, data?: Partial<GlCommandEntry>){
        this.name = name;
        Object.assign(this, data);
        if(typeof type === 'string'){
            this.type = nativeTypeCollection.get(type, this.forceOutparam);
        } else {
            this.type = type;
        }
    }

    getReturnMacro(val?: string): string {
        return this.type.returnMacro(val ? val : this.name, this.length);
    }

    getGetParamMacro(i: number): string {
        return this.type.getParamMacro(this, i);
    }

    getPointerName(){
        return this.type.isPointerType ? this.name : ('&' + this.name);
    }

    getExportName(){
        return this.name.replace(/^gl(\w)/, (match, group0) => group0.toLowerCase());
    }

    getGlPfnName(): string {
        return 'PFN' + this.name.replace('_', '').toUpperCase() + 'PROC';
    }
}

export class GlCommand extends GlCommandEntry {
    body?: string;
    docs?: string;
    params: GlCommandEntry[];
    getParams: GlCommandEntry[];
    glParams: GlCommandEntry[];
    outParams: GlCommandEntry[];
    hints?: NativeHintsCommand;
    overrideTsSignature?: string;

    constructor(name: string, type: NativeType, params: GlCommandEntry[] = []){
        super(name, type);
        this.hints = nativeHintsCommands[name];
        this.setParameters(params);
    }

    setParameters(params: GlCommandEntry[]){
        var replaceParams: { org: string, new: string }[] = [];
        this.params = params;

        if(this.hints && this.hints.params){
            Object.keys(this.hints.params).forEach(key => {
                const paramHint = this.hints && this.hints.params && this.hints.params[key];
                const toEditParam = this.params.find(param => param.name === key);

                if(!paramHint || !toEditParam){
                    return;
                }

                if(paramHint.replaceWithLocal){
                    toEditParam.name = paramHint.replaceWithLocal;
                    toEditParam.isReplacedWithLocal = true;
                }

                if(paramHint.glCallString){
                    toEditParam.glCallString = paramHint.glCallString;
                }

                if(paramHint.type){
                    toEditParam.type = paramHint.type;
                }
            });
        }

        if(this.hints && this.hints.syntheticParams){
            this.hints.syntheticParams.forEach(param =>
                this.params.push(new GlCommandEntry(param.name, param.type, { isSynthetic: true }))
            );
        }

        this.getParams = this.params.filter(param => !param.type.isOutType && !param.isReplacedWithLocal);
        this.glParams = this.params.filter(param => !param.isSynthetic);
        this.outParams = this.params.filter(param => param.type.isOutType && !param.isSynthetic);
    }

    getBody(){
        if(this.body){
            return this.body;
        }

        if(this.outParams.length > 1){
            throw new Error(`Command ${this.name} has ${this.outParams.length} out params - please implement manually.`);
        }

        if(this.outParams.length > 0 && this.type.name !== 'void'){
            throw new Error(`Command ${this.name} returns a value and has an out-param - please implement manually.`);
        }

        const outParam = this.outParams[0];

        let cSource = `napi_value napi_${this.name}(napi_env env, napi_callback_info info){`;

        // get required params
        if(this.getParams.length > 0){
            cSource += `GET_NAPI_PARAMS_INFO(${this.getParams.length}, "${this.getTypescriptSignature()}");`;
            cSource += this.getParams.map((param, i) => param.getGetParamMacro(i)).join('');
            cSource += '\n\n';
        }

        // declare out params
        if(outParam){
            cSource += outParam.type.outParamType + ' ' + outParam.name;
            cSource += outParam.type.outParamMalloc ? (' = ' + outParam.type.outParamMalloc(outParam.length)) : '';
            cSource += ';\n\n';
        }

        // don't directly return command return-value, bc:
        // * void doesn't return, so we don't wrap it in a napi-return call
        // * out param-functions have to return out param
        if(this.type.isUndefined || outParam){
            cSource += this.getGlCommandCall() + ';';
        }

        if(outParam){
            cSource += outParam.getReturnMacro();
        } else if(this.type.isUndefined){
            cSource += this.getReturnMacro();
        } else {
            cSource += this.getReturnMacro(this.getGlCommandCall());
        }

        cSource += '\n}';

        return cSource;
    }

    getTypescriptSignature(){
        return this.overrideTsSignature ? this.overrideTsSignature : `
            ${this.getExportName()}(${this.getParams.map(param => param.name + ': ' + param.type.tsType).join(', ')}): ${this.outParams.length > 0 ? this.outParams[0].type.tsType : this.type.tsType}
        `.trim();
    }

    getGlCommandCall(): string {
        return this.name + '(' + this.glParams.map(param => param.glCallString ? param.glCallString : param.type.isOutType ? param.getPointerName() : param.name).join(', ') + ')';
    }

    getProcTypedef(): string {
        return `typedef ${this.type.name} (APIENTRYP ${this.getGlPfnName()})(${this.glParams.map(param => `${param.type.name} ${param.name}`).join(', ')});`;
    }
}
