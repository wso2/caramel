var readPosts = function () {
	var path = "content/posts/";
	var dir = new File(path);
	var list = dir.listFiles();
	var body = "";
	var timearray = [];

	for(var i=0; i < list.length; i++){
		var timestamp = list[i].getName();
		timearray.push(timestamp);
		timearray.sort(function(a,b){return a-b});
	} 

	while(x=timearray.pop()){ 

	var blogFile = new File(path+x);
	blogFile.open("r");
	var post = "";
	post = blogFile.readAll();
	body +=post;
	body +="<br/>-----------END------------<br/>"
	blogFile.close();
	}


    return body;
};
