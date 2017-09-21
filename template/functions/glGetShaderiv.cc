napi_value napi_glGetShaderiv(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(2, "glGetShaderiv(shader: number, pname: number): number;");
    GET_NAPI_PARAM_UINT32(shader, 0);
    GET_NAPI_PARAM_GLENUM(pname, 1);

    GLint ret;
    glGetShaderiv(shader, pname, &ret);
    RETURN_NAPI_NUMBER(ret);
}
