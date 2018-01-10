napi_value napi_glGetVertexAttribPointerv(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(2, "glGetVertexAttribPointerv(index: number, pname: number): number;");
    GET_NAPI_PARAM_UINT32(index, 0);
    GET_NAPI_PARAM_GLENUM(pname, 1);

    void* ret = NULL;
    glGetVertexAttribPointerv(index, pname, &ret);
    RETURN_NAPI_UINT32(static_cast<GLuint>(reinterpret_cast<size_t>(ret)));
}
