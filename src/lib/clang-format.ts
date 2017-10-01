import { spawnClangFormat } from 'clang-format';
import { ChildProcess } from 'child_process';

export const formatCode = function(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let stdoutBuffer = '';
        let stderrBuffer = '';

        const cfmt: ChildProcess = spawnClangFormat(['-style={BasedOnStyle: google, IndentWidth: 4, ColumnLimit: 0}'], () => {}, ['pipe', 'pipe', 'pipe']);

        cfmt.stdin.write(code);
        cfmt.stdin.end('\n');

        cfmt.stdout.on('data', (b: Buffer) => stdoutBuffer += b.toString('utf8'));
        cfmt.stderr.on('data', (b: Buffer) => stderrBuffer += b.toString('utf8'));

        cfmt.on('exit', c => c === 0 ? resolve(stdoutBuffer) : reject(stderrBuffer));
    });
};
