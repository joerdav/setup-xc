import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';

import * as core from '@actions/core';
import * as toolCache from '@actions/tool-cache';
import * as semver from 'semver';

const xcToolName = 'xc';
const stableXcVersion = 'v0.1.181';
const xcAllReleasesUrl = 'https://api.github.com/repos/joerdav/xc/releases';

export function getExecutableExtension(): string {
    if (os.type().match(/^Win/)) {
        return '.exe';
    }
    return '';
}

export function getXCOSArchitecture(): string {
    let arch = os.arch();
    if (arch === 'x64') {
        return 'amd64';
    }
    return arch;
}

export function isValidRelease(toCheck: any, stable: string): boolean {
    return toCheck.toString().indexOf('rc') == -1 && semver.gt(toCheck, stable)
}

export async function getLatestXCVersion(): Promise<string> {
    try {
        const downloadPath = await toolCache.downloadTool(xcAllReleasesUrl);
        const responseArray = JSON.parse(fs.readFileSync(downloadPath, 'utf8').toString().trim());
        let latestXCVersion = semver.clean(stableXcVersion);
        responseArray.forEach((response: { tag_name: { toString: () => string; }; }) => {
            if (response && response.tag_name) {
                let selectedXCVersion = semver.clean(response.tag_name.toString());
                if (selectedXCVersion) {
                    if (isValidRelease(selectedXCVersion, latestXCVersion)) {
                        latestXCVersion = selectedXCVersion;
                    }
                }
            }
        });
        return "v" + latestXCVersion;
    } catch (error) {
        core.warning(util.format("Cannot get the latest xc releases infos from %s. Error %s. Using default builtin version %s.", xcAllReleasesUrl, error, stableXcVersion));
    }

    return stableXcVersion;
}

export function getXCDownloadURL(version: string, arch: string): string {
    switch (os.type()) {
        case 'Linux':
            return util.format('https://github.com/joerdav/xc/releases/download/%s/xc_%s_linux_%s.tar.gz', version, version, arch);

        case 'Darwin':
            return util.format('https://github.com/joerdav/xc/releases/download/%s/xc_%s_darwin_%s.tar.gz', version, version, arch);

        case 'Windows_NT':
        default:
            return util.format('https://github.com/joerdav/xc/releases/download/%s/xc_%s_windows_%s.zip', version, version, arch);

    }
}

export async function downloadXC(version: string): Promise<string> {
    if (!version) { version = await getLatestXCVersion(); }
    let cachedToolpath = toolCache.find(xcToolName, version);
    let xcDownloadPath = '';
    let extractedXCPath = '';
    let arch = getXCOSArchitecture();
    if (!cachedToolpath) {
        try {
            xcDownloadPath = await toolCache.downloadTool(getXCDownloadURL(version, arch));
            if(os.type() === 'Windows_NT') {
                extractedXCPath = await toolCache.extractZip(xcDownloadPath);
            } else {
                extractedXCPath = await toolCache.extractTar(xcDownloadPath);
            }
        } catch (exception) {
            if (exception instanceof toolCache.HTTPError && exception.httpStatusCode === 404) {
                throw new Error(util.format("xc '%s' for '%s' arch not found at '%s'.", version, arch, xcDownloadPath));
            } else {
                throw new Error('DownloadXCFailed');
            }
        }

        let toolName = xcToolName + getExecutableExtension()
        cachedToolpath = await toolCache.cacheDir(extractedXCPath, toolName, xcToolName, version);
    }

    const xcPath = path.join(cachedToolpath, xcToolName + getExecutableExtension());
    fs.chmodSync(xcPath, '777');
    return xcPath;
}

export async function run() {
    let version = core.getInput('version', { 'required': true });
    if (version.toLocaleLowerCase() === 'latest') {
        version = await getLatestXCVersion();
    }

    core.debug(util.format("Downloading xc version %s", version));
    let cachedXCPath = await downloadXC(version);

    core.addPath(path.dirname(cachedXCPath));

    console.log(`xc binary version: '${version}' has been cached at ${cachedXCPath}`);
    core.setOutput('xc-path', cachedXCPath);
}


run().catch(core.setFailed);
