var sapp=angular.module("exploratorySearch",[]);//responsible for search functions


sapp.controller('TabController', function(){
	this.active=2;
	this.setTab=function(tab){
		this.active=tab;
	}
	
	this.isActive=function(tab){
		return active==tab;
	}
});

sapp.controller('searchController', ['$scope','searchEngine',function ($scope,searchEngine){
	//define and initiate some variables
	var searchCtrl=this;
	searchCtrl.keywords=[{term:"infom",weight:0.3},{term:"search",weight:0.6},{term:"teach",weight:1}];
	
	searchCtrl.currentPage=0;//result page: first page=1
	var resultsPerPage=7;
	searchCtrl.eof=true;//end of list
	searchCtrl.bof=function(){
		return searchCtrl.currentPage<=1;
	};//beginning of list
	searchCtrl.results=[];
	searchCtrl.results_length=0;
	searchCtrl.nextPage=function(){
		if(!searchCtrl.eof){
			searchCtrl.currentPage++;	
			var beginIndex=searchCtrl.currentPage* resultsPerPage;
		var vlist=searchEngine.visible_results(beginIndex, resultsPerPage);
			searchCtrl.eof=vlist.eof;	
			searchCtrl.results=vlist.items;
		}
	}
	searchCtrl.previousPage=function(){
		if(!searchCtrl.bof()){
			searchCtrl.currentPage--;			
			beginIndex=(searchCtrl.currentPage-1) * resultsPerPage;
			var vlist=searchEngine.visible_results(beginIndex, resultsPerPage);
			searchCtrl.eof=vlist.eof;	
			searchCtrl.results=vlist.items;
		}
	}
	
	searchCtrl.search=function(query){
		searchCtrl.currentPage=0;
		searchEngine.search(query);
	}
	
	searchCtrl.result_type="both";
	
	$scope.$watch((angular.bind(this,
		function(){
			return searchEngine.results;
		})),
		function(){
			//on results fetched
			if(searchEngine.results){
				searchCtrl.results_length=searchEngine.results.length;
				searchCtrl.resultMessage=searchCtrl.results_length+" results found";
				//get the first page of results
				var vlist=searchEngine.visible_results(0,resultsPerPage);
				updateVisibleResults(vlist);
			}	
		}
	);
	
	
	function updateVisibleResults(vlist){
	searchCtrl.results=vlist.items;
	searchCtrl.eof=vlist.eof;
	if (searchCtrl.results.length>0){
		searchCtrl.currentPage=1;
	}
	
	}
	searchCtrl.resultMessage="";
}]);


sapp.controller('intentViewController',function(){
	
	this.x=0;
	this.y=0;
	this.getPosition=function(item){
		var r=100*item.weight;
		var agl=Math.random()*2 * Math.PI;
		
		var x=Math.round(r*Math.cos(agl));
		var y=Math.round(r*Math.sin(agl));
		//console.log("ang:"+agl+",x:"+x+",y:"+y);
		this.x=x;
		this.y=y;
	}
});



sapp.controller('resultItemController',['bookmarks', function(bookmarks){
	
	this.isFolded=true;//by default, it's folded
	//this.title="title not exceeding give amount of words";
	
	this.bookmark=false;//by default, no result item is bookmarked
	
	//check if this item has been bookmarked in previous sessions.
	this.checkBookmark=function (item){
		 this.bookmark=bookmarks.indexOf(item)<0?false:true;
	}
		
	this.toggleBookmark=function(item){	
		//add or remove item from bookmarks
		//this.bookmark=!this.bookmark;
		bookmarks.toggleBookmark(item, this.bookmark);
	};
	this.toggleDetails=function(){
		isFolded=!isFolded
	};
	
}]);

sapp.controller('bookmarksController',['bookmarks', function( bookmarks){
	this.items=bookmarks.documents;
	
}]);

sapp.controller('bookmarkItemController',['bookmarks', function( bookmarks){
	//there is only a remove function
	this.visible=true;
	this.hideItem=function(){
		visible=false;
	}
	this.removeItem=function(item){
		bookmarks.toggleBookmark(item, false);
		//should also update results, if any item has been set as bookmarked
		
	}
}]);

