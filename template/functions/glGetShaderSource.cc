napi_value napi_glGetShaderSource(napi_env env, napi_callback_info info){
    GET_NAPI_PARAMS_INFO(2, "glGetShaderSource(shader: number): string;");
    GET_NAPI_PARAM_GLENUM(shader, 0);

    GLint len;
    glGetShaderiv(shader, GL_SHADER_SOURCE_LENGTH, &len);
    GLchar* source = new GLchar[len];
    glGetShaderSource(shader, len, NULL, source);
    RETURN_NAPI_STRING(source);
}
