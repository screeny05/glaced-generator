napi_value napi_glGetFramebufferAttachmentParameteriv(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(3, "glGetFramebufferAttachmentParameteriv(target: number, attachment: number, pname: number): number;");
    GET_NAPI_PARAM_GLENUM(target, 0);
    GET_NAPI_PARAM_GLENUM(attachment, 1);
    GET_NAPI_PARAM_GLENUM(pname, 2);

    GLint ret;
    glGetFramebufferAttachmentParameteriv(target, attachment, pname, &ret);
    RETURN_NAPI_NUMBER(ret);
}
