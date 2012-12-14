var caramel = caramel || (function () {
    var init, cache, Theme, theme, Engine, engine, meta, render, configs, context, url, negotiate, send, sendJSON, build, helper,
        themes = {},
        engines = {};

    /**
     * Initializes the specified theme.
     * @param theme
     */
    init = function (theme) {
        require((configs().themes || '/themes') + '/' + theme + '/theme.js');
    };

    /**
     * Constructor of the Engine class.
     * @constructor
     */
    Engine = function (options) {
        var option;
        for (option in options) {
            if (options.hasOwnProperty(option)) {
                this[option] = options[option];
            }
        }
    };

    Engine.prototype = {
        init: function (theme) {

        },
        render: function () {
            print(data);
        },
        helper: function (type) {

        }
    };

    /**
     * The method to create or register a new engine or
     * extend an existing engine. i.e. If an existing engine can be
     * found with the specified name, new engine will be created by
     * extending it. Otherwise, totally new engine will be created.
     * Further newly created engine will be returned.
     * @param engine Existing engine name or engine object to be extended
     * @param options
     * @return {Engine}
     */
    engine = function (engine, options) {
        var e;
        if (!options) {
            return engines[engine];
        }
        e = new Engine(options);
        if (engine instanceof Engine) {
            e.__proto__ = engine;
        } else {
            if (engines[engine]) {
                e.__proto__ = engines[engine];
            } else {
                engines[engine] = e;
            }
        }
        return e;
    };

    /**
     * Constructor for the Theme class.
     * @param name
     * @param options
     * @constructor
     */
    Theme = function (name, options) {
        var option;
        this.name = name;
        var prototype = typeof options['prototype'] === 'string' ? theme(options['prototype']) : options['prototype'];
        if (prototype) {
            this.__proto__ = prototype;
            delete options['prototype'];
        }
        for (option in options) {
            if (options.hasOwnProperty(option)) {
                this[option] = options[option];
            }
        }
    };

    Theme.prototype = {
        themes: '/themes',

        base: function () {
            return this.themes + '/' + this.name;
        },

        resolve: function (path) {
            var fn, p = this.base() + '/' + path;
            if (new File(p).isExists() || !(this.__proto__ instanceof Theme)) {
                return p;
            }
            fn = this.__proto__.base;
            return fn ? fn.call(this.__proto__) + '/' + path : p;
        },

        url: function (path) {
            context = context || caramel.configs().context;
            return context + this.resolve(path);
        }
    };

    /**
     * The method to create/retrieve a theme
     * @param name
     * @param options
     * @return {Theme}
     */
    theme = function (name, options) {
        var theme, option;
        name = name || configs().themer();
        theme = themes[name];
        if (theme) {
            return theme;
        }
        if (options) {
            theme = (themes[name] = new Theme(name, options));
            for (option in options) {
                if (options.hasOwnProperty(option)) {
                    theme[option] = options[option];
                }
            }
            if (theme.engine.init) {
                theme.engine.init(theme);
            }
            return theme;
        }
        init(name);
        return themes[name];
    };

    /**
     * Get and set caramel configurations.
     * @param configs
     * @return {*}
     */
    configs = function (configs) {
        if (configs) {
            application.put('caramel', configs);
        } else {
            configs = application.get('caramel');
        }
        return configs;
    };

    /**
     * Generic render method called by pages. This will delegate rendering
     * to the engine.render(data, meta) of the active theme.
     * @param data
     */
    render = function (data) {
        var negotiation = configs().negotiation,
            meta = {
                data: data,
                request: request,
                response: response,
                session: session,
                application: application
            };
        caramel.meta(meta);
        if (!negotiation) {
            send(data, meta);
            return;
        }
        negotiate(data, meta);
    };

    cache = function () {
        return caramel.configs().cache;
    };

    helper = function () {
        var engine = caramel.theme().engine;
        return engine.helper.apply(engine, Array.prototype.slice.call(arguments));
    };

    negotiate = function (data, meta) {
        var req = meta.request, accept = req.getHeader('Accept');
        if (!accept) {
            send(data, meta);
            return;
        }
        accept = accept.toLowerCase();
        if (accept.indexOf('application/json') != -1) {
            sendJSON(data, meta);
            return;
        }
        send(data, meta);
    };

    send = function (data, meta) {
        caramel.theme().engine.render(data, meta);
    };

    sendJSON = function (data, meta) {
        print(build(data));
    };

    build = function (obj) {
        var name, o;
        for (name in obj) {
            if (obj.hasOwnProperty(name)) {
                o = obj[name];
                if (typeof o === 'function') {
                    obj[name] = o();
                }
            }
        }
        return obj;
    };

    /**
     * Get and set request specific metadata related to caramel.
     * @param meta
     * @return {*}
     */
    meta = function (meta) {
        return meta ? (__caramel_page_metadata__ = meta) : __caramel_page_metadata__;
    };

    /**
     * Resolves absolute paths by adding app context prefix.
     * @param path
     * @return {*}
     */
    url = function (path) {
        context = context || configs().context;
        return context + path;
    };

    return {
        meta: meta,
        cache: cache,
        theme: theme,
        engine: engine,
        render: render,
        helper: helper,
        configs: configs,
        url: url
    };
})();