<img src="https://rawgit.com/screeny05/0afe08431699ee1ef34dffca5db3caa8/raw/718fb10816d4628c776454deb5d6b352b0864df9/glace.svg" alt="Glace logo" title="Glace" align="right" height="110" />

# node-glace

> OpenGL Bindings Generator for node.js using napi

Generates OpenGL Bindings in the given version for the [NodeJS N-API](https://nodejs.org/api/n-api.html)

To use this package to generate your own bindings use this:
```bash
git clone git@github.com:screeny05/glaced-generator.git
cd glaced-generator
npm install
node_modules/.bin/tsc

# generate bindings
node dist download
node dist generate --api gles2 --version 2.0

# compile bindings
cd target
npm run build
```

## Usage
```
Usage: dist/index.js command [arguments]


Options:

  -V, --version  output the version number
  -h, --help     output usage information


Commands:

  download [options]   Downloads specification and documentation XML files
      -t --target <folder>  Target folder for XML files.
      -h, --help            output usage information

  generate [options]   Generates bindings
      -a --api <gles1|gles2|glsc2|gl|egl|glx|wgl>  API to generate bindings for.
      -v --version <version>                       Minimum required version.
      -s --source <folder>                         Folder containing the XML files.
      -t --target <folder>                         Target folder for generated bindings.
      -h, --help                                   output usage information
```

Currently tested and supported is only OpenGL ES 2.0.

## Versioning
This package follows semantic versioning. The generated packages will have this versioning `<@glaced/generator version>-<svn revision number>`. The revision number is retrieved when downloading the XMLs from the OpenGL SVN repo.

## License
MIT
