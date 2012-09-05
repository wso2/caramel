<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{title}}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">

    <!-- Le styles -->
    <link href="http://twitter.github.com/bootstrap/assets/css/bootstrap.css" rel="stylesheet">
    <style type="text/css">
        body {
            padding-top: 60px;
            padding-bottom: 40px;
        }
        .sidebar-nav {
            padding: 9px 0;
        }
    </style>
    <link href="http://twitter.github.com/bootstrap/assets/css/bootstrap-responsive.css" rel="stylesheet">

    <!-- Le HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
    <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    <![endif]-->

    <!-- Le fav and touch icons -->
    <link rel="shortcut icon" href="http://twitter.github.com/bootstrap/assets/ico/favicon.ico">
    <link rel="apple-touch-icon-precomposed" sizes="144x144" href="http://twitter.github.com/bootstrap/assets/ico/apple-touch-icon-144-precomposed.png">
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="http://twitter.github.com/bootstrap/assets/ico/apple-touch-icon-114-precomposed.png">
    <link rel="apple-touch-icon-precomposed" sizes="72x72" href="http://twitter.github.com/bootstrap/assets/ico/apple-touch-icon-72-precomposed.png">
    <link rel="apple-touch-icon-precomposed" href="http://twitter.github.com/bootstrap/assets/ico/apple-touch-icon-57-precomposed.png">

</head>

<body>

{{> menu_top}}

<div class="container-fluid">
    <div class="row-fluid">
        {{> menu_left}}
        {{> layout_base}}
    </div><!--/row-->

    <hr>

    <footer>
        {{> footer}}
    </footer>

</div><!--/.fluid-container-->

<!-- Le javascript
================================================== -->
<!-- Placed at the end of the document so the pages load faster -->
<script src="http://twitter.github.com/bootstrap/assets/js/jquery.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-transition.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-alert.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-modal.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-dropdown.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-scrollspy.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-tab.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-tooltip.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-popover.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-button.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-collapse.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-carousel.js"></script>
<script src="http://twitter.github.com/bootstrap/assets/js/bootstrap-typeahead.js"></script>

</body>
</html>