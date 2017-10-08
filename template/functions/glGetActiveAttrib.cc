napi_value napi_glGetActiveAttrib(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(2, "glGetActiveAttrib(program: number, index: number): GLESActiveInfo;");
    GET_NAPI_PARAM_UINT32(program, 0);
    GET_NAPI_PARAM_UINT32(index, 1);

    char name[1024];
    GLsizei length = 0;
    GLenum type;
    GLsizei size;
    glGetActiveAttrib(program, index, 1024, &length, &size, &type, name);

    RETURN_NAPI_GL_ACTIVE_INFO(name, size, type);
}
