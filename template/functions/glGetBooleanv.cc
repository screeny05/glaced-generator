napi_value napi_glGetBooleanv(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(1, "glGetBooleanv(pname: number): boolean;");
    GET_NAPI_PARAM_GLENUM(pname, 0);

    GLboolean ret;
    glGetBooleanv(pname, &ret);
    RETURN_NAPI_BOOL(ret);
}
