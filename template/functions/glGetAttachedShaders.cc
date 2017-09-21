napi_value napi_glGetAttachedShaders(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(1, "glGetAttachedShaders(program: number): number[];");
    GET_NAPI_PARAM_UINT32(program, 0);


    GLuint shaders[1024];
    GLsizei count;
    glGetAttachedShaders(program, 1024, &count, shaders);

    RETURN_NAPI_ARRAY_NUMBER(shaders, count);
}
