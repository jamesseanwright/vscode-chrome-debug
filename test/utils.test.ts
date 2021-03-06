/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as mockery from 'mockery';
import * as assert from 'assert';

import * as testUtils from './testUtils';

/** Utils without mocks - use for type only */
import * as _Utils from '../src/utils';

const MODULE_UNDER_TEST = '../src/utils';
suite('Utils', () => {
    function getUtils(): typeof _Utils {
        return require(MODULE_UNDER_TEST);
    }

    setup(() => {
        testUtils.setupUnhandledRejectionListener();
        testUtils.registerLocMocks();

        mockery.enable({ useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false });
        mockery.registerMock('fs', { statSync: () => { }, existsSync: () => false });
    });

    teardown(() => {
        testUtils.removeUnhandledRejectionListener();

        mockery.deregisterAll();
        mockery.disable();
    });

    suite('getBrowserLaunchCommand()', () => {
        test('osx', () => {
            mockery.registerMock('os', { platform: () => 'darwin' });
            const Utils = getUtils();
            assert.deepStrictEqual(
                Utils.getBrowserLaunchCommand(),
                ['open', '-a', 'google chrome', '-n', '--args']
            );
        });

        test('win', () => {
            // Overwrite the statSync mock to say the x86 path doesn't exist
            const statSync = (aPath: string) => {
                if (aPath.indexOf('(x86)') >= 0) throw new Error('Not found');
            };
            const existsSync = () => false;
            mockery.registerMock('fs', { statSync, existsSync });
            mockery.registerMock('os', { platform: () => 'win32' });

            const Utils = getUtils();
            assert.deepStrictEqual(
                Utils.getBrowserLaunchCommand(),
                ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'],
            );
        });

        test('winx86', () => {
            mockery.registerMock('os', { platform: () => 'win32' });
            const Utils = getUtils();
            assert.deepStrictEqual(
                Utils.getBrowserLaunchCommand(),
                ['C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'],
            );
        });

        test('linux', () => {
            mockery.registerMock('os', { platform: () => 'linux' });
            const Utils = getUtils();
            assert.deepStrictEqual(
                Utils.getBrowserLaunchCommand(),
                ['/usr/bin/google-chrome'],
            );
        });

        test('freebsd (default to Linux for anything unknown)', () => {
            mockery.registerMock('os', { platform: () => 'freebsd' });
            const Utils = getUtils();
            assert.deepStrictEqual(
                Utils.getBrowserLaunchCommand(),
                ['/usr/bin/google-chrome'],
            );
        });
    });

    suite('getTargetFilter()', () => {
        test('defaultTargetFilter', () => {
            const {defaultTargetFilter} = getUtils();
            const targets = [{type: 'page'}, {type: 'webview'}];
            assert.deepEqual(targets.filter(defaultTargetFilter), [{type: 'page'}]);
        });

        test('getTargetFilter', () => {
            const {getTargetFilter} = getUtils();
            const targets = [{type: 'page'}, {type: 'webview'}];
            assert.deepEqual(targets.filter(getTargetFilter(['page'])), [{type: 'page'}]);
            assert.deepEqual(targets.filter(getTargetFilter(['webview'])), [{type: 'webview'}]);
            assert.deepEqual(targets.filter(getTargetFilter(['page', 'webview'])), targets);
            // Falsy targetTypes should effectively disable filtering.
            assert.deepEqual(targets.filter(getTargetFilter()), targets);
        });
    });
});
