$().ready(function() {
			var opts = {
				cssClass : 'el-rte',
				height   : 450,
				toolbar  : 'complete',
				cssfiles : ['themes/htmlBlogAggregator/css/elrte-inner.css']
			}
			$('#editor').elrte(opts);

			$('#saveMe').click(function() {
			//alert($('#editor').elrte('val'));

    $.ajax({
      url: "lib/save.jag",
	  type: "POST",
      data: $('#editor').elrte('val'),
      success: function(){
          alert("success");
      },
      error:function(){
          alert("failure");
      }   
    }); 

		});
})
