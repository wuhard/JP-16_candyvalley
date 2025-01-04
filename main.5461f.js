window.boot = function () {
    var settings = window._CCSettings;
    window._CCSettings = undefined;
    var onProgress = null;
    
    var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
    var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
    var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
    function setLoadingDisplay () {
        // Loading splash scene
        var splash = document.getElementById('splash');
        var progressBar = splash.querySelector('.progress-bar span');
        onProgress = function (finish, total) {
            var percent = 100 * finish / total;
            if (progressBar) {
                progressBar.style.width = percent.toFixed(2) + '%';
            }
        };
        splash.style.display = 'block';
        progressBar.style.width = '0%';

        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            splash.style.display = 'none';
        });
    }

    var onStart = function () {

        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

        window.addEventListener('resize', () => {
            setTimeout(() => cc.view.emit('canvas-resize'), 0);
        });

        if (cc.sys.isBrowser) {
            setLoadingDisplay();
        }

        if (cc.sys.isMobile) {
            if (settings.orientation === 'landscape') {
                cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            }
            else if (settings.orientation === 'portrait') {
                cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            }
            cc.view.enableAutoFullScreen([
                cc.sys.BROWSER_TYPE_BAIDU,
                cc.sys.BROWSER_TYPE_BAIDU_APP,
                cc.sys.BROWSER_TYPE_WECHAT,
                cc.sys.BROWSER_TYPE_MOBILE_QQ,
                cc.sys.BROWSER_TYPE_MIUI,
                cc.sys.BROWSER_TYPE_HUAWEI,
                cc.sys.BROWSER_TYPE_UC,
            ].indexOf(cc.sys.browserType) < 0);
        }

        let maxConcurrency = 300;
        let maxRequestsPerFrame = 30;
        
        cc.assetManager.downloader.maxRetryCount = 15;
        cc.assetManager.downloader.retryInterval = 1000;
        cc.assetManager.downloader.maxConcurrency = maxConcurrency;
        cc.assetManager.downloader.maxRequestsPerFrame = maxRequestsPerFrame;
        cc.assetManager.presets.default.maxConcurrency = maxConcurrency;
        cc.assetManager.presets.default.maxRequestsPerFrame = maxRequestsPerFrame;
        cc.assetManager.presets.scene.maxConcurrency = maxConcurrency;
        cc.assetManager.presets.scene.maxRequestsPerFrame = maxRequestsPerFrame;
        cc.assetManager.presets.bundle.maxConcurrency = maxConcurrency;
        cc.assetManager.presets.bundle.maxRequestsPerFrame = maxRequestsPerFrame;
        cc.assetManager.presets.preload.maxConcurrency = maxConcurrency;
        cc.assetManager.presets.preload.maxRequestsPerFrame = maxRequestsPerFrame;

        var canvas = document.getElementById('tapclap-canvas');
        var launchScene = settings.launchScene;
        var bundle = cc.assetManager.bundles.find(function (b) {
            return b.getSceneInfo(launchScene);
        });
        
        if (cc.sys.isBrowser) {
            canvas.style.visibility = 'hidden';
        }

        if (cc.sys.isBrowser || cc.sys.isMobile) {
            if (window.ResizeObserver) {
                const resizeObserver = new ResizeObserver(() => window.dispatchEvent(new Event('resize'))); 
                
                resizeObserver.observe(document.getElementById('tapclap-frame'));
            }
        }

        bundle.loadScene(launchScene, null, onProgress,
            function (err, scene) {
                if (!err) {
                    cc.director.runSceneImmediate(scene);
                }
            }
        );

        cc.game.on('canvas-loaded', () => {
            if (cc.sys.isBrowser) {
                window.dispatchEvent(new Event('resize'));
            }
            
            canvas.style.visibility = 'visible';
        });
    };

    var frame = document.getElementById('tapclap-frame');
    var container = document.getElementById('tapclap-container');
    
    var option = {
        frame: frame,
        container: container,
        id: 'tapclap-canvas',
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: settings.debug,
        frameRate: 60,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
    };

    cc.assetManager.init({ 
        bundleVers: settings.bundleVers,
        remoteBundles: settings.remoteBundles,
        server: settings.server
    });
    
    var bundleRoot = [INTERNAL];
    settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

    var count = 0;
    function cb (err) {
        if (err) return console.error(err.message, err.stack);
        count++;
        if (count === bundleRoot.length + 1) {
            cc.assetManager.loadBundle(MAIN, function (err) {
                if (!err) cc.game.run(option, onStart);
            });
        }
    }

    cc.assetManager.loadScript(settings.jsList.map(function (x) { return 'src/' + x;}), cb);

    for (var i = 0; i < bundleRoot.length; i++) {
        cc.assetManager.loadBundle(bundleRoot[i], cb);
    }
};