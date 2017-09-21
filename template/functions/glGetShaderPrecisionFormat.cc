napi_value napi_glGetShaderPrecisionFormat(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(2, "glGetShaderPrecisionFormat(shadertype: number, precisiontype: number): GLShaderPrecisionFormat;");
    GET_NAPI_PARAM_GLENUM(shadertype, 0);
    GET_NAPI_PARAM_GLENUM(precisiontype, 1);

    GLint* range = new GLint[2];
    GLint precision;
    glGetShaderPrecisionFormat(shadertype, precisiontype, range, &precision);


    napi_value val;
    napi_value returnValue;
    NAPI_CALL(env, napi_create_object(env, &returnValue));
    NAPI_CALL(env, napi_create_number(env, range[0], &val));
    NAPI_CALL(env, napi_set_named_property(env, returnValue, "rangeMin", val));
    NAPI_CALL(env, napi_create_number(env, range[1], &val));
    NAPI_CALL(env, napi_set_named_property(env, returnValue, "rangeMax", val));
    NAPI_CALL(env, napi_create_number(env, precision, &val));
    NAPI_CALL(env, napi_set_named_property(env, returnValue, "precision", val));
    return returnValue;
}
