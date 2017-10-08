napi_value napi_glGetAttachedShaders(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(1, "glGetAttachedShaders(program: number): Uint32Array;");
    GET_NAPI_PARAM_UINT32(program, 0);


    GLuint shaders[1024];
    GLsizei count;
    glGetAttachedShaders(program, 1024, &count, shaders);

    RETURN_NAPI_TYPED_ARRAY_UINT32(count, shaders);
}
