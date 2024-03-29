import { GlCommandEntry } from './gl-xml';

// https://www.khronos.org/opengl/wiki/OpenGL_Type
// https://github.com/LWJGL/lwjgl/blob/8bb7dfefc628972e71568fac243503d8984555fc/src/templates/org/lwjgl/opengl/GL15.java

type NativeTypeGetParamMacro = (entry: GlCommandEntry, i: number) => string;
type NativeTypeReturnMacro = (returnValue: string, length?: string | number) => string;
type NativeTypeMacroCollection<T> = { [name: string]: T }

type NumberType = 'UINT' | 'INT' | 'FLOAT' | 'DOUBLE' | 'TYPED_ARRAY_UINT' | 'TYPED_ARRAY_INT' | 'TYPED_ARRAY_FLOAT' | 'TYPED_ARRAY_DOUBLE';

const guardMissingLength = (name: string, cb: NativeTypeReturnMacro) => (val, length) => {
    if(typeof length === 'undefined'){
        throw new TypeError('Must provide length for return of ' + name);
    }
    return cb(val, length);
}

const ReturnMacro: NativeTypeMacroCollection<NativeTypeReturnMacro> = {
    UNDEFINED: () => 'RETURN_NAPI_UNDEFINED();',
    NUMBER: val => `RETURN_NAPI_NUMBER(${val});`,
    INT32: val => `RETURN_NAPI_INT32(${val});`,
    UINT32: val => `RETURN_NAPI_UINT32(${val});`,
    INT64: val => `RETURN_NAPI_INT64(${val});`,
    DOUBLE: val => `RETURN_NAPI_DOUBLE(${val});`,
    STRING: val => `RETURN_NAPI_STRING(${val});`,
    BOOLEAN: val => `RETURN_NAPI_BOOL(${val});`,

    ARRAY_BUFFER: guardMissingLength('ARRAY_BUFFER', (val, length) => `RETURN_NAPI_ARRAY_BUFFER(${length}, ${val});`),

    ARRAY_NUMBER: guardMissingLength('ARRAY_BOOLEAN', (val, length) => `RETURN_NAPI_ARRAY_NUMBER(${length}, ${val});`),
    ARRAY_BOOLEAN: guardMissingLength('ARRAY_BOOLEAN', (val, length) => `RETURN_NAPI_ARRAY_BOOL(${length}, ${val});`),

    TYPED_ARRAY_UINT8: guardMissingLength('TYPED_ARRAY_UINT8', (val, length) => `RETURN_NAPI_TYPED_ARRAY_UINT8(${length}, ${val});`),
    TYPED_ARRAY_INT8: guardMissingLength('TYPED_ARRAY_INT8', (val, length) => `RETURN_NAPI_TYPED_ARRAY_INT8(${length}, ${val});`),
    TYPED_ARRAY_INT16: guardMissingLength('TYPED_ARRAY_INT16', (val, length) => `RETURN_NAPI_TYPED_ARRAY_INT16(${length}, ${val});`),
    TYPED_ARRAY_UINT16: guardMissingLength('TYPED_ARRAY_UINT16', (val, length) => `RETURN_NAPI_TYPED_ARRAY_UINT16(${length}, ${val});`),
    TYPED_ARRAY_UINT32: guardMissingLength('TYPED_ARRAY_UINT32', (val, length) => `RETURN_NAPI_TYPED_ARRAY_UINT32(${length}, ${val});`),
    TYPED_ARRAY_INT32: guardMissingLength('TYPED_ARRAY_INT32', (val, length) => `RETURN_NAPI_TYPED_ARRAY_INT32(${length}, ${val});`),
    TYPED_ARRAY_INT64: guardMissingLength('TYPED_ARRAY_INT64', (val, length) => `RETURN_NAPI_TYPED_ARRAY_INT64(${length}, ${val});`),
    TYPED_ARRAY_FLOAT: guardMissingLength('TYPED_ARRAY_FLOAT', (val, length) => `RETURN_NAPI_TYPED_ARRAY_FLOAT(${length}, ${val});`),
    TYPED_ARRAY_DOUBLE: guardMissingLength('TYPED_ARRAY_DOUBLE', (val, length) => `RETURN_NAPI_TYPED_ARRAY_DOUBLE(${length}, ${val});`),

    THROW_NOT_IMPLEMENTED: (type: any) => { throw new TypeError(`ReturnMacro not implemented for "${type.name}"`); },
}


const GetParamMacro: NativeTypeMacroCollection<NativeTypeGetParamMacro> = {
    UINT64: (e, i) => `GET_NAPI_PARAM_UINT64(${e.name}, ${i});`,
    INT64: (e, i) => `GET_NAPI_PARAM_INT64(${e.name}, ${i});`,
    UINT32: (e, i) => `GET_NAPI_PARAM_UINT32(${e.name}, ${i});`,
    INT32: (e, i) => `GET_NAPI_PARAM_INT32(${e.name}, ${i});`,
    UINT16: (e, i) => `GET_NAPI_PARAM_UINT16(${e.name}, ${i});`,
    INT16: (e, i) => `GET_NAPI_PARAM_INT16(${e.name}, ${i});`,
    UINT8: (e, i) => `GET_NAPI_PARAM_UINT8(${e.name}, ${i});`,
    INT8: (e, i)=> `GET_NAPI_PARAM_INT8(${e.name}, ${i});`,
    FLOAT: (e, i) => `GET_NAPI_PARAM_FLOAT(${e.name}, ${i});`,
    DOUBLE: (e, i) => `GET_NAPI_PARAM_DOUBLE(${e.name}, ${i});`,

    BOOLEAN: (e, i) => `GET_NAPI_PARAM_BOOL(${e.name}, ${i});`,

    STRING: (e, i) => `GET_NAPI_PARAM_STRING(${e.name}, ${i});`,

    ARRAY_BUFFER: (e, i) => `GET_NAPI_PARAM_ARRAY_BUFFER(${e.name}, ${i});`,

    TYPED_ARRAY_FLOAT: (e, i) =>  `GET_NAPI_PARAM_TYPED_ARRAY_FLOAT32(${e.name}, ${i});`,
    TYPED_ARRAY_DOUBLE: (e, i) => `GET_NAPI_PARAM_TYPED_ARRAY_FLOAT64(${e.name}, ${i});`,
    TYPED_ARRAY_UINT8: (e, i) => `GET_NAPI_PARAM_TYPED_ARRAY_UINT8(${e.name}, ${i});`,
    TYPED_ARRAY_INT8: (e, i) => `GET_NAPI_PARAM_TYPED_ARRAY_INT8(${e.name}, ${i});`,
    TYPED_ARRAY_INT16: (e, i) => `GET_NAPI_PARAM_TYPED_ARRAY_INT16(${e.name}, ${i});`,
    TYPED_ARRAY_UINT16: (e, i) => `GET_NAPI_PARAM_TYPED_ARRAY_UINT16(${e.name}, ${i});`,
    TYPED_ARRAY_INT32: (e, i) => `GET_NAPI_PARAM_TYPED_ARRAY_INT32(${e.name}, ${i});`,
    TYPED_ARRAY_UINT32: (e, i) => `GET_NAPI_PARAM_TYPED_ARRAY_UINT32(${e.name}, ${i});`,
    TYPED_ARRAY_INT64: (e, i) => `GET_NAPI_PARAM_TYPED_ARRAY_INT64(${e.name}, ${i});`,

    ARRAY_UINT32: (e, i) => `GET_NAPI_PARAM_ARRAY_UINT32(${e.name}, ${i});`,
    ARRAY_INT32: (e, i) => `GET_NAPI_PARAM_ARRAY_INT16(${e.name}, ${i});`,
    ARRAY_FLOAT: (e, i) => `GET_NAPI_PARAM_ARRAY_DOUBLE(${e.name}, ${i})`,

    THROW_NOT_IMPLEMENTED: (type: any) => { throw new TypeError(`GetParamMacro not implemented for "${type.name}"`); }
}


export class NativeType {
    name: string;
    returnMacro: NativeTypeReturnMacro = ReturnMacro.THROW_NOT_IMPLEMENTED.bind(null, this);
    getParamMacro: NativeTypeGetParamMacro = GetParamMacro.THROW_NOT_IMPLEMENTED.bind(null, this);
    tsType: string = 'any';
    outParamType?: string;
    outParamMalloc?: (length: string | number | undefined) => string;
    isOutType: boolean = false;
    isPointerType: boolean = false;

    constructor(obj?: Partial<NativeType>){
        if(obj) Object.assign(this, obj);
    }

    get isUndefined(){
        return this.name === 'void';
    }

    static newNumber(name: string, type: NumberType, bits?: number): NativeType {
        const numberType = new NativeType({
            name,
            tsType: 'number',
            returnMacro: ReturnMacro.UINT32
        });

        // GetParamMacro
        const getParamMacroName = type + (bits ? bits : '');
        const getParamMacro = GetParamMacro[getParamMacroName];
        if(getParamMacro){
            numberType.getParamMacro = getParamMacro;
        } else {
            throw new TypeError('GetParamMacro for number-type ' + getParamMacroName + ' not found.');
        }

        // ReturnMacro
        if(bits) {
            if(bits <= 32 && type === 'UINT'){
                numberType.returnMacro = ReturnMacro.UINT32;
            }
            if(bits <= 32 && type === 'INT'){
                numberType.returnMacro = ReturnMacro.INT32;
            }
            if(bits === 64){
                numberType.returnMacro = ReturnMacro.INT64;
            }
            if(type === 'FLOAT' || type === 'DOUBLE'){
                numberType.returnMacro = ReturnMacro.DOUBLE;
            }
        }

        return numberType;
    }

    static newOutNumber(name: string, outParamType: string, tsType: string, type: NumberType, byteLength: number, bits?: number): NativeType {
        const numberType = NativeType.newNumber(name, type, bits);
        const returnMacro = ReturnMacro[type + (bits ? bits : '')];

        if(!returnMacro){
            throw new TypeError('ReturnMacro for out number-type ' + type + (bits || '') + ' not found.');
        }

        numberType.isOutType = true;
        numberType.isPointerType = true;
        numberType.outParamType = outParamType;
        numberType.outParamMalloc = (length) => `(${outParamType})calloc(${length}, ${byteLength})`;
        numberType.returnMacro = returnMacro
        numberType.tsType = tsType;

        return numberType;
    }
}

class NativeTypeCollection {
    types: Map<string, NativeType[]> = new Map();

    add(type: NativeType){
        if(!type.name){
            throw new Error('Name required');
        }
        let associatedTypes = this.types.get(type.name);
        if(!associatedTypes){
            associatedTypes = [];
        }
        associatedTypes.push(type);

        // get outTypes first, they should be the default type, when no hint is given
        associatedTypes = associatedTypes.sort((a, b) => a.isOutType ? -1 : b.isOutType ? 1 : 0);
        this.types.set(type.name, associatedTypes);
    }

    get(name: string, forceOutparam?: boolean): NativeType {
        const associatedTypes = this.types.get(name);

        if(!associatedTypes){
            return new NativeType({ name });
        }

        if(typeof forceOutparam === 'boolean'){
            const foundType = associatedTypes.find(type => type.isOutType === forceOutparam);
            if(!foundType){
                throw new Error(`No associated out-type found for "${name}" being${forceOutparam ? '' : ' not'} an outParam. (${forceOutparam ? 'COMPSIZE': 'no-compsize'})`);
            }
            return foundType
        }

        return associatedTypes[0];
    }
}

export const nativeTypeCollection = new NativeTypeCollection();


// basics
nativeTypeCollection.add(new NativeType({
    name: 'void',
    tsType: 'void',
    returnMacro: ReturnMacro.UNDEFINED,
}));

nativeTypeCollection.add(new NativeType({
    name: 'GLboolean',
    tsType: 'boolean',
    getParamMacro: GetParamMacro.BOOLEAN,
    returnMacro: ReturnMacro.BOOLEAN,
}));

nativeTypeCollection.add(new NativeType({
    name: 'const GLchar *',
    tsType: 'string',
    getParamMacro: GetParamMacro.STRING,
    returnMacro: ReturnMacro.STRING,
}));

nativeTypeCollection.add(new NativeType({
    name: 'const GLubyte *',
    tsType: 'string',
    getParamMacro: GetParamMacro.STRING,
    returnMacro: ReturnMacro.STRING,
}));

const INT = 'INT';
const UINT = 'UINT';

nativeTypeCollection.add(NativeType.newNumber('GLubyte', UINT, 8));
nativeTypeCollection.add(NativeType.newNumber('GLbyte', INT, 8));
nativeTypeCollection.add(NativeType.newNumber('GLushort', UINT, 16));
nativeTypeCollection.add(NativeType.newNumber('GLshort', INT, 16));
nativeTypeCollection.add(NativeType.newNumber('GLuint', UINT, 32));
nativeTypeCollection.add(NativeType.newNumber('GLint', INT, 32));
nativeTypeCollection.add(NativeType.newNumber('GLuint64', UINT, 64));
nativeTypeCollection.add(NativeType.newNumber('GLint64', INT, 64));
nativeTypeCollection.add(NativeType.newNumber('GLfloat', 'FLOAT'));
nativeTypeCollection.add(NativeType.newNumber('GLdouble', 'DOUBLE'));

nativeTypeCollection.add(NativeType.newNumber('GLfixed', INT, 32));
nativeTypeCollection.add(NativeType.newNumber('GLsizei', INT, 32));
nativeTypeCollection.add(NativeType.newNumber('GLenum', UINT, 32));
nativeTypeCollection.add(NativeType.newNumber('GLintptr', INT, 64));
nativeTypeCollection.add(NativeType.newNumber('GLsizeiptr', INT, 64));
nativeTypeCollection.add(NativeType.newNumber('GLbitfield', INT, 32));
nativeTypeCollection.add(NativeType.newNumber('GLhalf', INT, 16));
nativeTypeCollection.add(NativeType.newNumber('GLclampf', 'FLOAT'));
nativeTypeCollection.add(NativeType.newNumber('GLclampd', 'DOUBLE'));


// objects
nativeTypeCollection.add(new NativeType({
    name: 'const void *',
    tsType: 'ArrayBufferView | ArrayBuffer',
    returnMacro: ReturnMacro.ARRAY_BUFFER,
    getParamMacro: GetParamMacro.ARRAY_BUFFER
}));
nativeTypeCollection.add(new NativeType({
    name: 'void *',
    tsType: 'ArrayBuffer | ArrayBufferView',
    returnMacro: ReturnMacro.ARRAY_BUFFER,
    getParamMacro: GetParamMacro.ARRAY_BUFFER,
}));

nativeTypeCollection.add(new NativeType({
    name: 'GLsync',
    tsType: 'any',
    returnMacro: (val) => `NAPI_RETURN_GL_SYNC(val);`,
    getParamMacro: (e, i) => `NAPI_GET_GL_SYNC(${e.name}, i);`
}));


// CHECK
nativeTypeCollection.add(new NativeType({
    name: 'void **',
    tsType: 'ArrayBuffer | ArrayBufferView',
    returnMacro: ReturnMacro.ARRAY_BUFFER,
    getParamMacro: GetParamMacro.ARRAY_BUFFER,
}));

// typed arrays
nativeTypeCollection.add(new NativeType({
    name: 'const GLfloat *',
    tsType: 'Float32Array',
    getParamMacro: GetParamMacro.TYPED_ARRAY_FLOAT
}));

nativeTypeCollection.add(new NativeType({
    name: 'const GLdouble *',
    tsType: 'Float64Array',
    getParamMacro: GetParamMacro.TYPED_ARRAY_DOUBLE
}));

nativeTypeCollection.add(new NativeType({
    name: 'const GLint *',
    tsType: 'Int32Array',
    getParamMacro: GetParamMacro.TYPED_ARRAY_INT32
}));

nativeTypeCollection.add(new NativeType({
    name: 'const GLuint *',
    tsType: 'Uint32Array',
    getParamMacro: GetParamMacro.TYPED_ARRAY_UINT32
}));

nativeTypeCollection.add(new NativeType({
    name: 'const GLenum *',
    tsType: 'Uint32Array',
    getParamMacro: GetParamMacro.TYPED_ARRAY_UINT32
}));

nativeTypeCollection.add(new NativeType({
    name: 'const GLbyte *',
    tsType: 'Int8Array',
    getParamMacro: GetParamMacro.TYPED_ARRAY_INT8
}));

nativeTypeCollection.add(new NativeType({
    name: 'const GLshort *',
    tsType: 'Int16Array',
    getParamMacro: GetParamMacro.TYPED_ARRAY_INT16
}));

nativeTypeCollection.add(new NativeType({
    name: 'const GLushort *',
    tsType: 'Uint16Array',
    getParamMacro: GetParamMacro.TYPED_ARRAY_UINT16
}));

// CHECK
nativeTypeCollection.add(new NativeType({
    name: 'const GLboolean *',
    tsType: 'Uint8Array',
    getParamMacro: GetParamMacro.TYPED_ARRAY_UINT8
}));

// general arrays
nativeTypeCollection.add(new NativeType({
    name: 'GLuint *',
    tsType: 'number[]',
    returnMacro: ReturnMacro.ARRAY_NUMBER,
    getParamMacro: GetParamMacro.ARRAY_UINT32
}));
nativeTypeCollection.add(new NativeType({
    name: 'GLfloat *',
    tsType: 'number[]',
    returnMacro: ReturnMacro.ARRAY_NUMBER,
    getParamMacro: GetParamMacro.ARRAY_FLOAT
}));
nativeTypeCollection.add(new NativeType({
    name: 'GLint *',
    tsType: 'number[]',
    returnMacro: ReturnMacro.ARRAY_NUMBER,
    getParamMacro: GetParamMacro.ARRAY_INT32
}));




// out-params
nativeTypeCollection.add(new NativeType({
    name: 'GLboolean *',
    tsType: 'boolean[]',
    returnMacro: ReturnMacro.ARRAY_BOOLEAN,
    outParamType: 'GLboolean',
    isOutType: true
}));
/*nativeTypeCollection.add(new NativeType({
    name: 'void *',
    tsType: 'ArrayBuffer | ArrayBufferView',
    returnMacro: ReturnMacro.ARRAY_BUFFER,
    getParamMacro: GetParamMacro.ARRAY_BUFFER,
    outParamType: 'void',
    isOutType: true
}));*/

nativeTypeCollection.add(NativeType.newOutNumber('GLfloat *', 'GLfloat *', 'Float32Array', 'TYPED_ARRAY_FLOAT', 4));
nativeTypeCollection.add(NativeType.newOutNumber('GLdouble *', 'GLdouble *', 'Float64Array', 'TYPED_ARRAY_DOUBLE', 4));
nativeTypeCollection.add(NativeType.newOutNumber('GLubyte *', 'GLubyte *', 'Uint8Array', 'TYPED_ARRAY_UINT', 4, 8));
nativeTypeCollection.add(NativeType.newOutNumber('GLushort *', 'GLushort *', 'Uint16Array', 'TYPED_ARRAY_UINT', 4, 16));
nativeTypeCollection.add(NativeType.newOutNumber('GLint *', 'GLint *', 'Int32Array', 'TYPED_ARRAY_INT', 4, 32));
nativeTypeCollection.add(NativeType.newOutNumber('GLuint *', 'GLuint *', 'Uint32Array', 'TYPED_ARRAY_UINT', 4, 32));
nativeTypeCollection.add(NativeType.newOutNumber('GLint64 *', 'GLint64 *', 'Int64Array', 'TYPED_ARRAY_INT', 4, 64));
nativeTypeCollection.add(NativeType.newOutNumber('GLsizei *', 'GLsizei *', 'Int32Array', 'TYPED_ARRAY_INT', 4, 32));
nativeTypeCollection.add(NativeType.newOutNumber('GLenum *', 'GLenum *', 'Uint32Array', 'TYPED_ARRAY_UINT', 4, 32));

// CHECK
nativeTypeCollection.add(NativeType.newOutNumber('GLchar *', 'GLchar *', 'Int32Array', 'TYPED_ARRAY_INT', 4, 32));
