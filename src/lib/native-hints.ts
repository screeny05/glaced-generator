import { NativeType, nativeTypeCollection } from './type-matcher';

const setParamLength = (name: string, len: string | number) => ({
    params: {
        [name]: { len }
    }
});

const addLengthParam = (name: string, lengthName: string = 'length') => ({
    params: {
        [name]: {
            len: lengthName
        }
    },
    syntheticParams: [{
        name: lengthName,
        type: nativeTypeCollection.get('GLuint')
    }]
});

export interface NativeHintsCommand {
    params?: {
        [paramName: string]: {
            isOutType?: boolean,
            len?: number|string
        }
    },
    syntheticParams?: {
        name: string,
        type: NativeType
    }[]
}

export const nativeHintsCommands: { [commandName: string]: NativeHintsCommand } = {
    // hardcoded length, always should be 1
    glGetTexParameterfv: setParamLength('params', 1),
    glGetTexParameteriv: setParamLength('params', 1),
    glGetShaderiv: setParamLength('params', 1),
    glGetRenderbufferParameteriv: setParamLength('params', 1),
    glGetProgramiv: setParamLength('params', 1),
    glGetBufferParameteriv: setParamLength('params', 1),

    // needs additional parameter for determining array-size
    glGetUniformiv: addLengthParam('params'),
    glGetUniformfv: addLengthParam('params'),
    glGetBooleanv: addLengthParam('data'),
    glGetDoublev: addLengthParam('data'),
    glGetFloatv: addLengthParam('data'),
    glGetIntegerv: addLengthParam('data'),
    glGetFramebufferAttachmentParameteriv: addLengthParam('params')
};
