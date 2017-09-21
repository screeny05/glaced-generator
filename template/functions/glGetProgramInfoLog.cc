napi_value napi_glGetProgramInfoLog(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(1, "glGetProgramInfoLog(program: number): string;");
    GET_NAPI_PARAM_UINT32(program, 0);

    int len = 1024;
    char error[1024];
    glGetProgramInfoLog(program, 1024, &len, error);
    RETURN_NAPI_STRING(error);
}
