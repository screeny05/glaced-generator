napi_value napi_glGetBufferParameteriv(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(2, "glGetBufferParameteriv(target: number, pname: number): number;");
    GET_NAPI_PARAM_GLENUM(target, 0);
    GET_NAPI_PARAM_GLENUM(pname, 1);

    GLint ret;
    glGetBufferParameteriv(target, pname, &ret);
    RETURN_NAPI_NUMBER(ret);
}
