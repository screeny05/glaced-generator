import { NativeType, nativeTypeCollection } from './type-matcher';

const setParamLength = (name: string, len: string | number) => ({
    params: {
        [name]: { len }
    }
});

const replaceParamWithLocal = (name: string, localName: string, glCallString: string = localName) => ({
    params: {
        [name]: {
            replaceWithLocal: localName,
            glCallString
        }
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
            isOutType?: boolean;
            len?: number | string;
            replaceWithLocal?: string;
            glCallString?: string;
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
    glGetFramebufferAttachmentParameteriv: addLengthParam('params'),

    // TODO remove hardcoded length params
    // TODO glDeleteFramebuffers & alike, replace n with buffer_length
    glUniform1fv: replaceParamWithLocal('count', 'byteLength_value'),
    glUniform1iv: replaceParamWithLocal('count', 'byteLength_value'),
    glUniform2fv: replaceParamWithLocal('count', 'byteLength_value'),
    glUniform2iv: replaceParamWithLocal('count', 'byteLength_value'),
    glUniform3iv: replaceParamWithLocal('count', 'byteLength_value'),
    glUniform3fv: replaceParamWithLocal('count', 'byteLength_value'),
    glUniform4iv: replaceParamWithLocal('count', 'byteLength_value'),
    glUniform4fv: replaceParamWithLocal('count', 'byteLength_value'),
    glUniformMatrix2fv: replaceParamWithLocal('count', 'byteLength_value', 'byteLength_value  / 4'),
    glUniformMatrix3fv: replaceParamWithLocal('count', 'byteLength_value', 'byteLength_value  / 9'),
    glUniformMatrix4fv: replaceParamWithLocal('count', 'byteLength_value', 'byteLength_value  / 16'),
    glDeleteBuffers: replaceParamWithLocal('n', 'byteLength_buffers'),
    glDeleteFramebuffers: replaceParamWithLocal('n', 'byteLength_framebuffers'),
    glDeleteRenderbuffers: replaceParamWithLocal('n', 'byteLength_renderbuffers'),
    glDeleteTextures: replaceParamWithLocal('n', 'byteLength_textures'),
    glBufferData: replaceParamWithLocal('size', 'byteLength_data'),
    glBufferSubData: replaceParamWithLocal('size', 'byteLength_data'),
    glCompressedTexImage2D: replaceParamWithLocal('imageSize', 'byteLength_data'),
    glCompressedTexSubImage2D: replaceParamWithLocal('imageSize', 'byteLength_data'),
};
