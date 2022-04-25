/*
 * grunt-connect-proxy
 * https://github.com/drewzboto/grunt-connect-proxy
 *
 * Copyright (c) 2013 Drewz
 * Licensed under the MIT license.
 */

'use strict';
var utils = require('../lib/utils');

module.exports = function (grunt) {
    grunt.registerTask('configureProxies', 'Configure any specified connect proxies.', function (config) {
        // setup proxy
        var httpProxy = require('http-proxy');
        var proxyOption;
        var proxyOptions = [];
        var validateProxyConfig = function (proxyOption) {
            if (typeof proxyOption.host === 'undefined' || typeof proxyOption.context === 'undefined') {
                grunt.log.error('Proxy missing host or context configuration');
                return false;
            }
            if (proxyOption.https && proxyOption.port === 80) {
                grunt.log.warn('Proxy  for ' + proxyOption.context + ' is using https on port 80. Are you sure this is correct?');
            }
            return true;
        };

        utils.reset();
        utils.log = grunt.log;
        if (config) {
            var connectOptions = grunt.config('connect.' + config) || [];
            if (typeof connectOptions.appendProxies === 'undefined' || connectOptions.appendProxies) {
                proxyOptions = proxyOptions.concat(grunt.config('connect.proxies') || []);
            }
            proxyOptions = proxyOptions.concat(connectOptions.proxies || []);
        } else {
            proxyOptions = proxyOptions.concat(grunt.config('connect.proxies') || []);
        }
        proxyOptions.forEach(function (proxy) {
            proxyOption = defaults(proxy, {
                port: proxy.https ? 443 : 80,
                https: false,
                secure: true,
                xforward: false,
                rules: [],
                errorHandler: function (req, res, next) { },
                ws: false
            });
            if (validateProxyConfig(proxyOption)) {
                proxyOption.rules = utils.processRewrites(proxyOption.rewrite);
                utils.registerProxy({
                    server: httpProxy.createProxyServer({
                        target: utils.getTargetUrl(proxyOption),
                        secure: proxyOption.secure,
                        xfwd: proxyOption.xforward,
                        headers: {
                            host: proxyOption.host
                        },
                        hostRewrite: proxyOption.hostRewrite
                    }).on('error', function (err, req, res) {
                        grunt.log.error('Proxy error: ', err.code);
                    }),
                    config: proxyOption
                });
                grunt.log.writeln('Proxy created for: ' + proxyOption.context + ' to ' + proxyOption.host + ':' + proxyOption.port);
            }
        });
    });

    // WARNING: This is not a drop in replacement solution and
    // it might not work for some edge cases. Test your code!
    var defaults = (...args) => args.reverse().reduce((acc, obj) => ({ ...acc, ...obj }), {});
};
