napi_value napi_glGetShaderInfoLog(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(1, "glGetShaderInfoLog(shader: number): string;");
    GET_NAPI_PARAM_UINT32(shader, 0);

    int len = 1024;
    char error[1024];
    glGetShaderInfoLog(shader, 1024, &len, error);
    RETURN_NAPI_STRING(error);
}
