import GlSpecParser from './lib/spec-parser';

export default async function(){
    const specParser = new GlSpecParser('gles2', '2.0');

    await specParser.parseSpecFolder('./data/spec');
    await specParser.parseDocFolder('./data/doc');
    await specParser.loadPrewrittenFunctions('./template/functions');

    specParser.buildApi();

    await specParser.api.generateFiles('./target');
}
