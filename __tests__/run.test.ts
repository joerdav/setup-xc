import * as core from '@actions/core';
import * as toolCache from '@actions/tool-cache';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import * as run from '../src/run';

describe('Testing all functions in run file.', () => {
    test('run() must download specified xc version and set output', async () => {
        jest.spyOn(core, 'getInput').mockReturnValue('v0.4.0');
        jest.spyOn(toolCache, 'find').mockReturnValue('pathToCachedTool');
        jest.spyOn(os, 'type').mockReturnValue('Linux');
        jest.spyOn(fs, 'chmodSync').mockImplementation();
        jest.spyOn(core, 'addPath').mockImplementation();
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(core, 'setOutput').mockImplementation();

        expect(await run.run()).toBeUndefined();
        expect(core.getInput).toBeCalledWith('version', { 'required': true });
        expect(core.addPath).toBeCalledWith('pathToCachedTool');
        expect(core.setOutput).toBeCalledWith('xc-path', path.join('pathToCachedTool', 'xc'));
    });

    test('getExecutableExtension() must return .exe file extension when os equals Windows', () => {
        jest.spyOn(os, 'type').mockReturnValue('Windows_NT');

        expect(run.getExecutableExtension()).toBe('.exe');
        expect(os.type).toBeCalled();
    });

    test('getExecutableExtension() must return an empty string for non-windows OS', () => {
        jest.spyOn(os, 'type').mockReturnValue('Darwin');

        expect(run.getExecutableExtension()).toBe('');
        expect(os.type).toBeCalled();
    });

    test.each([
        ['arm', 'arm'],
        ['arm64', 'arm64'],
        ['x64', 'amd64']
    ])("getXcArch() must return on %s os architecture %s xc architecture", (osArch, xcVersion) => {
        jest.spyOn(os, 'arch').mockReturnValue(osArch);

        expect(run.getXCOSArchitecture()).toBe(xcVersion);
        expect(os.arch).toBeCalled();
    }); test.each([
        ['arm64'],
        ['amd64']
    ])('getXCDownloadURL() must return the URL to download %s xc for Linux based systems', (arch) => {
        jest.spyOn(os, 'type').mockReturnValue('Linux');
        const xcLinuxUrl = util.format('https://github.com/joerdav/xc/releases/download/v0.4.0/xc_v0.4.0_linux_%s.tar.gz', arch);

        expect(run.getXCDownloadURL('v0.4.0', arch)).toBe(xcLinuxUrl);
        expect(os.type).toBeCalled();
    });

    test.each([
        ['arm64'],
        ['amd64']
    ])('getXCDownloadURL() must return the URL to download %s xc for MacOS based systems', (arch) => {
        jest.spyOn(os, 'type').mockReturnValue('Darwin');
        const xcDarwinUrl = util.format('https://github.com/joerdav/xc/releases/download/v0.4.0/xc_v0.4.0_darwin_%s.tar.gz', arch);

        expect(run.getXCDownloadURL('v0.4.0', arch)).toBe(xcDarwinUrl);
        expect(os.type).toBeCalled();
    });

    test.each([
        ['amd64']
    ])('getXCDownloadURL() must return the URL to download %s xc for Windows based systems', (arch) => {
        jest.spyOn(os, 'type').mockReturnValue('Windows_NT');
        const xcWindowsUrl = util.format('https://github.com/joerdav/xc/releases/download/v0.4.0/xc_v0.4.0_windows_%s.zip', arch);

        expect(run.getXCDownloadURL('v0.4.0', arch)).toBe(xcWindowsUrl);
        expect(os.type).toBeCalled();
    });

    test('downloadXC() must download xc tarball, add it to github actions tool cache and return the path to extracted dir', async () => {
        jest.spyOn(toolCache, 'find').mockReturnValue('');
        jest.spyOn(toolCache, 'downloadTool').mockReturnValue(Promise.resolve('xcDownloadPath'));
        jest.spyOn(toolCache, 'extractTar').mockReturnValue(Promise.resolve('xcExtractedFolder'));

        jest.spyOn(toolCache, 'cacheDir').mockReturnValue(Promise.resolve('pathToCachedTool'));
        jest.spyOn(os, 'type').mockReturnValue('Linux');
        jest.spyOn(fs, 'chmodSync').mockImplementation(() => {});

        expect(await run.downloadXC('v0.4.0')).toBe(path.join('pathToCachedTool', 'xc'));
        expect(toolCache.find).toBeCalledWith('xc', 'v0.4.0');
        expect(toolCache.downloadTool).toBeCalled();
        expect(toolCache.cacheDir).toBeCalled();
        expect(os.type).toBeCalled();
        expect(fs.chmodSync).toBeCalledWith(path.join('pathToCachedTool', 'xc'), '777');
    });

    test('downloadXC() must download xc zip archive, add it to github actions tool cache and return the path to extracted dir', async () => {
        jest.spyOn(toolCache, 'find').mockReturnValue('');
        jest.spyOn(toolCache, 'downloadTool').mockReturnValue(Promise.resolve('xcDownloadPath'));
        jest.spyOn(toolCache, 'extractZip').mockReturnValue(Promise.resolve('xcExtractedFolder'));

        jest.spyOn(toolCache, 'cacheDir').mockReturnValue(Promise.resolve('pathToCachedTool'));
        jest.spyOn(os, 'type').mockReturnValue('Windows_NT');
        jest.spyOn(fs, 'chmodSync').mockImplementation(() => {});

        expect(await run.downloadXC('v0.4.0')).toBe(path.join('pathToCachedTool', 'xc.exe'));
        expect(toolCache.find).toBeCalledWith('xc', 'v0.4.0');
        expect(toolCache.downloadTool).toBeCalled();
        expect(toolCache.cacheDir).toBeCalled();
        expect(os.type).toBeCalled();
        expect(fs.chmodSync).toBeCalledWith(path.join('pathToCachedTool', 'xc.exe'), '777');
    });

    test('getLatestXCVersion() must download latest version file, read version and return it', async () => {
        jest.spyOn(toolCache, 'downloadTool').mockResolvedValue('pathToTool');
        const response = JSON.stringify(
            [
                {
                    'tag_name': 'v0.4.0'
                }, {
                    'tag_name': 'v0.3.0'
                }, {
                    'tag_name': 'v0.2.0'
                }
            ]
        );
        jest.spyOn(fs, 'readFileSync').mockReturnValue(response);

        expect(await run.getLatestXCVersion()).toBe('v0.4.0');
        expect(toolCache.downloadTool).toBeCalled();
        expect(fs.readFileSync).toBeCalledWith('pathToTool', 'utf8');
    });
})
