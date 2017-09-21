napi_value napi_glShaderSource(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(2, "glShaderSource(shader: number, code: string): void;");
    GET_NAPI_PARAM_INT32(shader, 0);
    GET_NAPI_PARAM_STRING(code, 1);

    const char* codes[1];
    codes[0] = code;
    GLint length = bufferSize_code;
    glShaderSource(shader, 1, codes, &length);
    RETURN_NAPI_UNDEFINED();
}
