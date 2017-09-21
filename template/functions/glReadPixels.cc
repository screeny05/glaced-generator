napi_value napi_glReadPixels(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(6, "glReadPixels(x: number, y: number, width: number, height: number, format: number, type: number): ArrayBuffer;");
    GET_NAPI_PARAM_INT32(x, 0);
    GET_NAPI_PARAM_INT32(y, 1);
    GET_NAPI_PARAM_INT32(width, 2);
    GET_NAPI_PARAM_INT32(height, 3);
    GET_NAPI_PARAM_GLENUM(format, 4);
    GET_NAPI_PARAM_GLENUM(type, 5);

    void *pixels;

    glReadPixels(x, y, width, height, format, type, &pixels);
    RETURN_NAPI_ARRAY_BUFFER(width * height, pixels);
}
