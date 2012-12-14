caramel.engine('handlebars', (function () {
    var renderData, renderJS, renderCSS, partials, init, page, render, layout,
        renderer, helper, helpers, pages, populate, rendererHelper, layoutHelper, serialize,
        rendererHelpers = {},
        layoutHelpers = {},
        Handlebars = require('handlebars').Handlebars;

    /**
     * Registers  'include' handler for area inclusion within handlebars templates.
     * {{include body}}
     */
    Handlebars.registerHelper('include', function (contexts) {
        var i, config, cache, theme,
            length = contexts ? contexts.length : 0,
            html = '';
        if (length == 0) {
            return html;
        }
        config = caramel.configs();
        cache = config.cache || (config.cache = {});
        theme = caramel.theme();
        contexts.sort(function (c1, c2) {
            return (c2.weight || 0) - (c1.weight || 0);
        });
        for (i = 0; i < length; i++) {
            html += renderData(contexts[i], theme, cache);
        }
        return new Handlebars.SafeString(html);
    });

    /**
     * Registers  'js' handler for JavaScript inclusion within handlebars templates.
     * {{js .}}
     */
    Handlebars.registerHelper('js', function (contexts) {
        var i, url,
            theme = caramel.theme(),
            js = contexts._.js,
            length = js.length,
            html = '';
        if (length == 0) {
            return html;
        }
        url = theme.url;
        for (i = 0; i < length; i++) {
            html += renderJS(url.call(theme, '_/' + js[i]));
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
            html += renderCSS(url.call(theme, '_/' + css[i]));
        }
        return new Handlebars.SafeString(html);
    });

    /**
     * Registers  'code' handler for JavaScript inclusion within handlebars templates.
     * {{code .}}
     */
    Handlebars.registerHelper('code', function (contexts) {
        var i,
            code = contexts._.code,
            length = code.length,
            html = '';
        if (length == 0) {
            return html;
        }
        for (i = 0; i < length; i++) {
            html += code[i];
        }
        return new Handlebars.SafeString(html);
    });

    /**
     * Registers  'url' handler for resolving theme files.
     * {{url "js/jquery-lates.js"}}
     */
    Handlebars.registerHelper('url', function (path) {
        return caramel.theme().url(path);
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

    renderData = function (data, theme, cache) {
        var path, file, template, context = data.context;
        if (data.template) {
            path = theme.resolve(data.template);
            if (theme.cache) {
                template = cache[path];
            }
            if (!template) {
                file = new File(path);
                file.open('r');
                template = (cache[path] = Handlebars.compile(file.readAll()));
                file.close();
            }
        } else {
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

    renderJS = function (js) {
        return '<script type="application/javascript" src="' + js + '"></script>';
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

    /**
     * Init function of handlebars engine. This can be overridden by new themes.
     * @param theme
     */
    init = function (theme) {
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
                Handlebars.registerPartial(prefix, file.readAll());
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
            layout = (page.layout = {_: {}}),
            areas = page.areas,
            length = areas.length;
        for (i = 0; i < length; i++) {
            layout[areas[i]] = [];
        }
        for (name in data) {
            if (data.hasOwnProperty(name)) {
                this.layout({
                    name: name,
                    context: data[name]
                }, layout, meta);
            }
        }
        for (area in layout) {
            if (layout.hasOwnProperty(area)) {
                items = layout[area];
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
        layout._.js = js;
        layout._.css = css;
        layout._.code = code;
        path = caramel.theme().resolve(this.pages + '/' + page.template);
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
     * @return {Function}
     */
    layout = function (data, layout, meta) {
        var path, fn, theme, page,
            name = data.name;
        fn = this.helper('layout', name);
        if (fn) {
            fn.call(this, data, layout, meta);
            return;
        }
        theme = caramel.theme();
        path = theme.resolve(this.helpers + '/' + name + '.js');
        if (new File(path).isExists()) {
            require(path);
            fn = this.helper('layout', name);
            if (fn) {
                fn.call(this, data, layout, meta);
                return;
            }
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
        var name = data.name,
            fn = this.helper('renderer', name),
            theme = caramel.theme(),
            template = name + '.hbs';
        if (fn) {
            return fn.call(this, data.context, area, meta);
        }
        return {
            template: new File(theme.resolve(template)).isExists() ? template : null,
            js: ['js/' + name + '.js'],
            css: ['css/' + name + '.css'],
            code: ['code/' + name + '.hbs']
        };
    };

    helper = function (type) {
        var args = Array.prototype.slice.call(arguments).slice(1);
        switch (type) {
            case 'renderer':
                return rendererHelper.apply(this, args);
            case 'layout':
                return layoutHelper.apply(this, args);
            default:
                return null;
        }
    };

    rendererHelper = function (name, fn) {
        return fn ? (rendererHelpers[name] = fn) : rendererHelpers[name];
    };

    layoutHelper = function (name, fn) {
        return fn ? (layoutHelpers[name] = fn) : layoutHelpers[name];
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
        helpers: helpers,
        init: init,
        page: page,
        render: render,
        layout: layout,
        renderer: renderer,
        helper: helper
    };
})());