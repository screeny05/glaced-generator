#ifndef GLAPI
#define GLAPI extern
#endif

typedef void* (* GLACEloadproc)(const char *name);
GLAPI void glaceLoadGl(GLACEloadproc);
