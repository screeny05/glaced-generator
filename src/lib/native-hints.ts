import { NativeType, nativeTypeCollection } from './type-matcher';

const setParamAsOut = (name: string, len?: string | number) => ({
    params: {
        [name]: {
            isOutType: true,
            len
        }
    }
});

const addLengthParam = (name: string, lengthName: string = 'length') => ({
    params: {
        [name]: {
            isOutType: true,
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
    // params is only the return number[]
    glGetVertexAttribiv: setParamAsOut('params'),
    glGetVertexAttribfv: setParamAsOut('params'),
    glGenBuffers: setParamAsOut('buffers'),
    glGenFramebuffers: setParamAsOut('framebuffers'),
    glGenRenderbuffers: setParamAsOut('renderbuffers'),
    glGenTextures: setParamAsOut('textures'),
    glGetFramebufferAttachmentParameteriv: setParamAsOut('params'),

    // hardcoded length, always should be 1
    glGetTexParameterfv: setParamAsOut('params', 1),
    glGetTexParameteriv: setParamAsOut('params', 1),
    glGetShaderiv: setParamAsOut('params', 1),
    glGetRenderbufferParameteriv: setParamAsOut('params', 1),
    glGetProgramiv: setParamAsOut('params', 1),
    glGetBufferParameteriv: setParamAsOut('params', 1),

    // needs additional parameter for determining array-size
    glGetUniformiv: addLengthParam('params'),
    glGetUniformfv: addLengthParam('params'),
};
