napi_value napi_glGetFloatv(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(1, "glGetFloatv(pname: number): number;");
    GET_NAPI_PARAM_GLENUM(pname, 0);

    GLfloat ret;
    glGetFloatv(pname, &ret);
    RETURN_NAPI_NUMBER(ret);
}
