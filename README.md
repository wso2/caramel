Caramel
=======


Caramel is a MVC framework built for Jaggery. The intent of the framework is to bootstrap application development and enforce a standard for developing web applications using Jaggery. By no means Caramel trying to lock down developer creativity or freedom but simply trying enforce discipline to large development teams working on Jaggery projects.

A web application written according to Caramel, takes a certain structure, this is to separate the models, controllers and the views

Lets learn by an example;

Caramel application config (app.js)

    caramel.configs({
    context: '/blog',
    negotiation: true,
    themer: function () {
        return 'classic';
    }
    });

The app config informs caramel to use the specified theme to render the provided data, it also specifies the application context and if content negotiation is enabled or not, which we will get back later.

The meaning of defining a theme is that, by a configuration change, a new theme can be plugged to the application, and the concept is native to Caramel


A simple “Hello World” with Caramel
====================================

First let's write a simple Hello World Jaggery App.

Application name : hello, Theme: default

Lets call the homepage of the app “index.jag”. In Caramel, the page that servers the request act as one of the controllers of the app. it defines what data needs to be presented in that particular page. Content of the page can be as follows


Hello World home page
======================
Lets call it index.jag

    <%
    var caramel;
    var body = "Hello World";
    caramel = require('caramel').caramel;
    caramel.render({
        'title': {text :'Hello Title'}, // set html title for index page
        'body': {text:body} //set html body for index page
    });
    %>

This jag file will provide the title as Hello Title and the body as Hello World to caramel render.

Now lets move to the theme,

First we need to set handlebars as the caramel theming engine. Under the themes/classic directory lets create theme.js

    var engine = caramel.engine('handlebars', (function () {
    }()));

lets write some HTML with handlebars which is going to define the view for our theme classic.

Create simple.hbs inside themes/classic/pages

    <html>
    <head>
        <title>{{include title}}</title>
    </head>
    <body>
        <div>{{include body}}</div>
    </body>
    </html>

This will let our theme to include the title and the body partials, which we are going to create in the next step. Partials come to play when you have a single template that you need to use in different contexts.For example you can use above template in different contexts by setting different titles and body contents.

Now lets create above inside themes/classic/partials directory,

title.hbs

    {{{title}}}

body.hbs

    {{{body}}}

Lets move to the renderer, Create index.js inside themes/classic/renderes

    var render = function (theme, data, meta, require) {
    theme('simple', {
        title: [
            { partial:'title', context: data.title}
        ],
        body: [
            { partial:'body', context: data.body}
        ]
        });
    };


Now you can browse the homepage and it will display rendered web page with  Hello Title
as the  title and  Hello World as the body.
