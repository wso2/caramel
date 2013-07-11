var caramel = require('caramel');

caramel.configs({
    context: '/htmlBlogAggregator',
    cache: true,
    negotiation: true,
    themer: function () {
        return 'htmlBlogAggregator';
    }
});
