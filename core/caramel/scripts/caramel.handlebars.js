caramel.engine('handlebars', (function () {
    var renderData, renderJS, renderCSS, partials, init, page, render, layout, meta,
        renderer, helper, helpers, pages, populate, serialize,
        log = new Log(),
        Handlebars = require('handlebars').Handlebars;

    /**
     * Registers  'include' handler for area inclusion within handlebars templates.
     * {{include body}}
     */
    Handlebars.registerHelper('include', function (contexts) {
        var i, config, cache, theme,
            length = contexts ? contexts.length : 0,
            html = '';
        if (log.isDebugEnabled()) {
            log.debug('Including : ' + stringify(contexts));
        }
        if (length == 0) {
            return html;
        }
        config = caramel.configs();
        cache = config.cache || (config.cache = {});
        theme = caramel.theme();
        if (contexts instanceof Array) {
            for (i = 0; i < length; i++) {
                html += renderData(contexts[i], theme, cache);
            }
        } else {
            html = renderData(contexts, theme, cache);
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
    Handlebars.registerHelper("data", function (obj, options) {
        var fn,
            data = caramel.meta().data;
        data = options ? data[obj] : data;
        fn = options ? options.fn : obj.fn;
        return fn(data);
    });

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
        var i, file, template,
            theme = caramel.theme(),
            code = contexts._.code,
            length = code.length,
            html = '';
        if (length == 0) {
            return html;
        }
        for (i = 0; i < length; i++) {
            file = new File(theme.resolve(code[i]));
            file.open('r');
            template = Handlebars.compile(file.readAll());
            file.close();
            html += template(contexts);
        }
        return new Handlebars.SafeString(html);
    });

    /**
     * Registers  'url' handler for resolving theme files.
     * {{url "js/jquery-lates.js"}}
     */
    Handlebars.registerHelper('url', function (path) {
        if(path.indexOf('http://') === 0 || path.indexOf('https://') === 0) {
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
        var code,
            config = caramel.configs();
        code = 'var caramel = caramel || {}; caramel.context = "' + config.context + '"; caramel.themer = "' + theme.name + '";';
        code += "caramel.url = function (path) { return this.context + (path.charAt(0) !== '/' ? '/' : '') + path; };";
        return renderJS(code, true);
    };

    renderData = function (data, theme, cache) {
        var path, file, template, context = data.context;
        if (data.template) {
            if (log.isDebugEnabled()) {
                log.debug('Rendering template "' + data.name + '" : ' + data.template);
            }
            path = theme.resolve(data.template);
            if (theme.cache) {
                template = cache[path];
            }
            if (!template) {
                file = new File(path);
                file.open('r');
                template = (cache[path] = Handlebars.compile(file.readAll()));
                file.close();
                if (log.isDebugEnabled()) {
                    log.debug('Loaded template - "' + data.name + '" : ' + data.template);
                }
            }
        } else {
            if (log.isDebugEnabled()) {
                log.debug('No template, serializing data - "' + data.name + '"');
            }
            template = serialize;
        }
        return template(typeof context === 'function' ? context() : context);
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

    /**
     * Directory for the partial lookup.
     * @type {String}
     */
    partials = 'partials';

    pages = 'pages';

    helpers = 'helpers';

    helper = function (name) {
        var theme = caramel.theme(),
            path = theme.resolve(helpers + '/' + name + '.js');
        return new File(path).isExists() ? require(path) : null;
    };

    /**
     * Init function of handlebars engine. This can be overridden by new themes.
     * @param theme
     */
    init = function (theme) {
        if (log.isDebugEnabled()) {
            log.debug('Initializing engine handlebars with theme : ' + theme.name);
        }
        (function partials(prefix, file) {
            var i, length, name, files;
            if (file.isDirectory()) {
                files = file.listFiles();
                length = files.length;
                for (i = 0; i < length; i++) {
                    file = files[i];
                    partials(prefix ? prefix + '.' + file.getName() : file.getName(), file);
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
        })('', new File(theme.resolve(this.partials)));
    };

    /**
     * Page function of handlebars engine. This can be overridden by new themes.
     * @param data
     * @param meta
     * @return {*}
     */
    page = function (data, meta) {
        return (meta.page = {
            template: 'page.hbs',
            areas: ['title', 'header', 'footer', 'left', 'body', 'right'],
            areaDefault: 'body'
        });
    };

    /**
     * Render function of handlebars engine. This can be overridden by new themes.
     * @param data
     * @param meta
     */
    render = function (data, meta) {
        var file, template, path, i, area, items, item, name,
            js = [],
            css = [],
            code = [],
            config = caramel.configs(),
            cache = config.cache || (config.cache = {}),
            page = this.page(data, meta),
            layout = (page.layout = {}),
            areas = page.areas,
            length = areas.length;
        for (i = 0; i < length; i++) {
            layout[areas[i]] = [];
        }
        for (name in data) {
            if (data.hasOwnProperty(name) && name !== '_') {
                this.layout({
                    name: name,
                    context: data[name]
                }, layout, meta);
            }
        }
        for (area in layout) {
            if (layout.hasOwnProperty(area)) {
                items = layout[area];
                items.sort(function (c1, c2) {
                    return (c2.weight || 0) - (c1.weight || 0);
                });
                length = items.length;
                for (i = 0; i < length; i++) {
                    item = items[i];
                    renderer = this.renderer(item, page, area, meta);
                    if (!renderer) {
                        continue;
                    }
                    item.template = renderer.template;
                    js = js.concat(renderer.js);
                    css = css.concat(renderer.css);
                    code = code.concat(renderer.code);
                }
            }
        }
        layout._ = {};
        layout._.js = js;
        layout._.css = css;
        layout._.code = code;
        if (log.isDebugEnabled()) {
            log.debug('Layout generated : ' + stringify(layout));
        }
        path = caramel.theme().resolve(this.pages + '/' + page.template);
        if (log.isDebugEnabled()) {
            log.debug('Rendering page : ' + path);
        }
        if (this.cache) {
            template = cache[path];
        }
        if (!template) {
            file = new File(path);
            file.open('r');
            template = (cache[page] = Handlebars.compile(file.readAll()));
            file.close();
        }
        print(template(layout));
    };

    /**
     * Layout function of handlebars engine. This can be overridden by new themes.
     * @param data
     * @param layout
     * @param meta
     */
    layout = function (data, layout, meta) {
        var page,
            name = data.name,
            hp = helper(name);
        if (hp && hp.layout) {
            hp.layout.call(this, data, layout, meta);
            return;
        }
        page = meta.page;
        if (page.areaDefault) {
            layout[page.areaDefault].push(data);
        }
    };

    /**
     * Renderer function of handlebars engine. This can be overridden.
     * @param data
     * @param area
     * @param meta
     * @return {Object}
     */
    renderer = function (data, area, meta) {
        var path, template, ren,
            name = data.name,
            js = [],
            css = [],
            code = [],
            hp = helper(name),
            theme = caramel.theme();
        if (hp && hp.renderer) {
            ren = hp.renderer.call(this, data.context, area, meta);
            if (log.isDebugEnabled()) {
                log.debug('Overridden renderer - "' + name + '" : ' + stringify(ren));
            }
            return ren;
        }
        path = name + '.hbs';
        if (new File(theme.resolve(path)).isExists()) {
            template = path;
        }
        path = 'js/' + name + '.js';
        if (new File(theme.resolve(path)).isExists()) {
            js.push(path);
        }
        path = 'css/' + name + '.css';
        if (new File(theme.resolve(path)).isExists()) {
            css.push(path);
        }
        path = 'code/' + name + '.hbs';
        if (new File(theme.resolve(path)).isExists()) {
            code.push(path);
        }
        ren = {
            template: template,
            js: js,
            css: css,
            code: code
        };
        if (log.isDebugEnabled()) {
            log.debug('Default renderer - "' + name + '" : ' + stringify(ren));
        }
        return ren;
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
        pages: pages,
        init: init,
        page: page,
        render: render,
        layout: layout,
        renderer: renderer
    };
})());