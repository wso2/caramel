caramel.engine('handlebars', (function () {
    var renderData, renderJS, renderCSS, partials, init, page, render, layout, meta, layoutsDir, partialsDir,
        renderer, helper, helpersDir, pagesDir, populate, serialize, globals, cache, codesDir,
        log = new Log(),
        Handlebars = require('handlebars').Handlebars;

    /**
     * Registers  'include' handler for area inclusion within handlebars templates.
     * {{include body}}
     */
    Handlebars.registerHelper('include', function (contexts) {
        var i, cache,
            length = contexts ? contexts.length : 0,
            html = '';
        if (log.isDebugEnabled()) {
            log.debug('Including : ' + stringify(contexts));
        }
        if (length == 0) {
            return html;
        }
        cache = caramel.configs().cache;
        if (contexts instanceof Array) {
            for (i = 0; i < length; i++) {
                html += renderData(contexts[i], cache);
            }
        } else {
            html = renderData(contexts, cache);
        }
        return new Handlebars.SafeString(html);
    });

    /**
     * {{#itr context}}key : {{key}} value : {{value}}{{/itr}}
     */
    Handlebars.registerHelper("itr", function (obj, options) {
        var key, buffer = '';
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                buffer += options.fn({key: key, value: obj[key]});
            }
        }
        return buffer;
    });

    /**
     * {{#func myFunction}}{{/func}}
     */
    Handlebars.registerHelper("func", function (obj, options) {
        return options.fn(obj());
    });

    /**
     * {{#data "asset"}}{{/data}}
     * {{#data}}{{/data}}
     */
    /*Handlebars.registerHelper("data", function (obj, options) {
     var fn,
     data = caramel.meta().data;
     data = options ? data[obj] : data;
     fn = options ? options.fn : obj.fn;
     return fn(data);
     });*/

    /**
     * Registers  'js' handler for JavaScript inclusion within handlebars templates.
     * {{js .}}
     */
    Handlebars.registerHelper('js', function (contexts) {
        var i, url, html,
            theme = caramel.theme(),
            js = contexts._.js,
            length = js.length;
        html = meta(theme);
        if (length == 0) {
            return new Handlebars.SafeString(html);
        }
        url = theme.url;
        for (i = 0; i < length; i++) {
            //remove \n when production = true
            html += '\n' + renderJS(url.call(theme, js[i]));
        }
        return new Handlebars.SafeString(html);
    });

    /**
     * Registers  'css' handler for CSS inclusion within handlebars templates.
     * {{css .}}
     */
    Handlebars.registerHelper('css', function (contexts) {
        var i, url,
            theme = caramel.theme(),
            css = contexts._.css,
            length = css.length,
            html = '';
        if (length == 0) {
            return html;
        }
        url = theme.url;
        for (i = 0; i < length; i++) {
            html += renderCSS(url.call(theme, css[i]));
        }
        return new Handlebars.SafeString(html);
    });

    /**
     * Registers  'code' handler for JavaScript inclusion within handlebars templates.
     * {{code .}}
     */
    Handlebars.registerHelper('code', function (contexts) {
        var i, file, template, key,
            theme = caramel.theme(),
            caching = caramel.configs().cache,
            codes = contexts._.code,
            length = codes.length,
            prefix = codesDir + '/',
            html = '';
        if (length == 0) {
            return html;
        }
        for (i = 0; i < length; i++) {
            key = prefix + codes[i];
            if (caching) {
                template = cache(key);
            }
            if (!template) {
                file = new File(theme.resolve(codes[i]) + '.hbs');
                file.open('r');
                template = cache(key, Handlebars.compile(file.readAll()));
                file.close();
            }
            html += template(contexts);
        }
        return new Handlebars.SafeString(html);
    });

    /**
     * Registers  'url' handler for resolving theme files.
     * {{url "js/jquery-lates.js"}}
     */
    Handlebars.registerHelper('url', function (path) {
        if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0) {
            return path;
        }
        return caramel.url(path);
    });

    /**
     * Registers  'cap' handler for resolving theme files.
     * {{url "js/jquery-lates.js"}}
     */
    Handlebars.registerHelper('cap', function (str) {
        return str.replace(/[^\s]+/g, function (str) {
            return str.substr(0, 1).toUpperCase() + str.substr(1).toLowerCase();
        });
    });

    /**
     * {{#slice start="1" end="10" count="2" size="2"}}{{name}}{{/slice}}
     */
    Handlebars.registerHelper('slice', function (context, block) {
        var html = "",
            length = context.length,
            start = parseInt(block.hash.start) || 0,
            end = parseInt(block.hash.end) || length,
            count = parseInt(block.hash.count) || length,
            size = parseInt(block.hash.size) || length,
            i = start,
            c = 0;
        while (i < end && c++ < count) {
            html += block(context.slice(i, (i += size)));
        }
        return html;
    });

    meta = function (theme) {
        var code, g,
            meta = caramel.meta(),
            config = caramel.configs();
        code = 'var caramel = caramel || {}; caramel.context = "' + config.context + '"; caramel.themer = "' + theme.name + '";';
        code += "caramel.url = function (path) { return this.context + (path.charAt(0) !== '/' ? '/' : '') + path; };";
        g = theme.engine.globals(meta.data, meta);
        code += g || '';
        return renderJS(code, true);
    };

    renderData = function (data, caching) {
        var template,
            key = partialsDir + '/' + data.partial,
            context = typeof data.context === 'function' ? data.context() : data.context;
        if (data.partial) {
            if (log.isDebugEnabled()) {
                log.debug('Rendering template ' + data.partial);
            }
            if (caching) {
                template = cache(key);
            }
            if (!template) {
                template = cache(key, Handlebars.compile(Handlebars.partials[data.partial]));
            }
        } else {
            if (log.isDebugEnabled()) {
                log.debug('No template, serializing data');
            }
            template = serialize;
        }
        return template(context);
    };

    serialize = function (o) {
        var type = typeof o;
        switch (type) {
            case 'string':
            case 'number':
                return o;
            default :
                return stringify(o);
        }
    };

    renderJS = function (js, inline) {
        return '<script type="application/javascript"' + (inline ? '>' + js : ' src="' + js + '">') + '</script>';
    };

    renderCSS = function (css) {
        return '<link rel="stylesheet" type="text/css" href="' + css + '"/>';
    };

    codesDir = 'codes';

    pagesDir = 'pages';

    helpersDir = 'helpers';

    partialsDir = 'partials';

    layoutsDir = 'layouts';

    helper = function (name) {
        var theme = caramel.theme(),
            path = theme.resolve(helpersDir + '/' + name + '.js');
        return new File(path).isExists() ? require(path) : null;
    };

    partials = function (Handlebars) {
        var theme = caramel.theme();
        (function register(prefix, file) {
            var i, length, name, files;
            if (file.isDirectory()) {
                files = file.listFiles();
                length = files.length;
                for (i = 0; i < length; i++) {
                    file = files[i];
                    register(prefix ? prefix + '.' + file.getName() : file.getName(), file);
                }
            } else {
                name = file.getName();
                if (name.substring(name.length - 4) !== '.hbs') {
                    return;
                }
                file.open('r');
                Handlebars.registerPartial(prefix.substring(0, prefix.length - 4), file.readAll());
                file.close();
            }
        })('', new File(theme.resolve(partialsDir)));
    };

    /**
     * Init function of handlebars engine. This can be overridden by new themes.
     * @param theme
     */
    init = function (theme) {
        if (log.isDebugEnabled()) {
            log.debug('Initializing engine handlebars with theme : ' + theme.name);
        }
        this.partials(Handlebars);
    };

    /**
     * Render function of handlebars engine. This can be overridden by new themes.
     * @param data
     * @param meta
     */
    render = function (data, meta) {
        var file, template, path, layout, area, areas, blocks, block, length, i, hp, key,
            js = [],
            css = [],
            code = [],
            config = caramel.configs();
        layout = this.layout(data, meta);
        if (!layout) {
            print(caramel.build(data));
            return;
        }
        js = layout.js ? js.concat(layout.js) : js;
        css = layout.css ? css.concat(layout.css) : css;
        code = layout.code ? code.concat(layout.code) : code;
        areas = layout.areas;
        for (area in areas) {
            if (areas.hasOwnProperty(area)) {
                blocks = areas[area];
                length = blocks.length;
                for (i = 0; i < length; i++) {
                    renderer = null;
                    block = blocks[i];
                    if (!block.partial) {
                        continue;
                    }
                    hp = helper(block.partial);
                    if (hp) {
                        if (hp.renderer) {
                            renderer = hp.renderer.call(this, block, area, meta);
                            if (log.isDebugEnabled()) {
                                log.debug('Overridden renderer - "' + block.partial + '" : ' + stringify(renderer));
                            }
                        }
                        if (hp.format) {
                            block.context = hp.format(block.context, data, layout.page, area, meta);
                            if (log.isDebugEnabled()) {
                                log.debug('Formatted data - "' + block.partial + '" : ' + stringify(block.context));
                            }
                        }
                    }
                    if (!renderer) {
                        renderer = this.renderer(block, layout.page, area, meta);
                    }
                    js = js.concat(renderer.js);
                    css = css.concat(renderer.css);
                    code = code.concat(renderer.code);
                }
            }
        }
        areas._ = {};
        areas._.js = js;
        areas._.css = css;
        areas._.code = code;
        if (log.isDebugEnabled()) {
            log.debug('Layout generated : ' + stringify(areas));
        }
        path = caramel.theme().resolve(pagesDir + '/' + layout.page + '.hbs');
        if (log.isDebugEnabled()) {
            log.debug('Rendering page : ' + path);
        }
        key = pagesDir + '/' + layout.page;
        if (config.cache) {
            template = cache(key);
        }
        if (!template) {
            file = new File(path);
            file.open('r');
            template = cache(key, Handlebars.compile(file.readAll()));
            file.close();
        }
        print(template(areas));
    };

    /**
     * Renderer function of handlebars engine. This can be overridden.
     * @param data
     * @param area
     * @param meta
     * @return {Object}
     */
    renderer = function (data, area, meta) {
        var path, ren,
            js = [],
            css = [],
            code = [],
            theme = caramel.theme();
        path = 'js/' + data.partial + '.js';
        if (new File(theme.resolve(path)).isExists()) {
            js.push(path);
        }
        path = 'css/' + data.partial + '.css';
        if (new File(theme.resolve(path)).isExists()) {
            css.push(path);
        }
        path = 'code/' + data.partial + '.hbs';
        if (new File(theme.resolve(path)).isExists()) {
            code.push(path);
        }
        ren = {
            partial: data.partial,
            js: js,
            css: css,
            code: code
        };
        if (log.isDebugEnabled()) {
            log.debug('Default renderer - "' + data.partial + '" : ' + stringify(ren));
        }
        return ren;
    };

    layout = function (data, meta) {
        var fn,
            layout = null,
            theme = caramel.theme(),
            path = meta.request.getMappedPath() || meta.request.getRequestURI();
        path = theme.resolve(layoutsDir + path.substring(0, path.length - 4) + '.js');
        if (log.isDebugEnabled()) {
            log.debug('Layouting data for the request using : ' + path);
        }
        if (new File(path).isExists()) {
            fn = require(path).layout;
            layout = fn ? fn(data, meta) : data;
        }
        if (log.isDebugEnabled()) {
            log.debug('Layout data : ' + stringify(layout));
        }
        return layout;
    };

    globals = function (data, meta) {
        return null;
    };

    cache = function (key, val) {
        //TODO : handlebars fails due to rhino's prototyping model, hence caching is disabled
        return val;
        /*if (!val) {
         return application.get(key);
         }
         application.put(key, val);
         return val;*/
    };

    populate = function (dir, ext, theme) {
        var i, n,
            a = [],
            files = new File(theme.resolve(dir + ext)),
            l1 = ext.length,
            l2 = files.length;
        for (i = 0; i < l2; i++) {
            n = files[i].getName();
            if (n.substring(n.length - l1) !== '.' + ext) {
                continue;
            }
            a.push(ext + '/' + n);
        }
        return a;
    };

    return {
        partials: partials,
        globals: globals,
        init: init,
        render: render,
        layout: layout,
        renderer: renderer
    };
})());