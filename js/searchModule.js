var sapp=angular.module("exploratorySearch",[]);//responsible for search functions


sapp.controller('TabController', function($scope){
	$scope.active=2;
	$scope.setTab=function(tab){
		$scope.active=tab;
	}
	
	$scope.isActive=function(tab){
		return active==tab;
	}
});

sapp.controller('searchController', ['$scope','searchEngine',function ($scope, searchEngine){
	//define and initiate some variables
	$scope.keywords=[{term:"infom",weight:0.3},{term:"search",weight:0.6},{term:"teach",weight:1}];
	
	$scope.currentPage=0;//result page: first page=1
	$scope.resultsPerPage=7;
	$scope.eof=true;//end of list
	$scope.bof=function(){
		return $scope.currentPage<=1;
	};//beginning of list
	$scope.results=[];
	$scope.results_length=0;
	$scope.nextPage=function(){
		if(!$scope.eof){
			$scope.currentPage++;	
			var beginIndex=$scope.currentPage*$scope.resultsPerPage;
		var vlist=searchEngine.visible_results(beginIndex,$scope.resultsPerPage);
			$scope.eof=vlist.eof;	
			$scope.results=vlist.items;
		}
	}
	$scope.previousPage=function(){
		if(!$scope.bof()){
			$scope.currentPage--;			beginIndex=$scope.currentPage*$scope.resultsPerPage;
			var vlist=searchEngine.visible_results(beginIndex,$scope.resultsPerPage);
			$scope.eof=vlist.eof;	
			$scope.results=vlist.items;
		}
	}
	
	
	$scope.search=function(query){
		$scope.currentPage=0;
		searchEngine.getData("dummyResults.txt").success(function(data){
			searchEngine.results=data.docs;
			//console.log("search...")
			//console.log(data);
		//get the first page
			var vlist=searchEngine.visible_results(0,$scope.resultsPerPage);
			$scope.results=vlist.items;
			$scope.eof=vlist.eof;
			if ($scope.results.length>0){
				$scope.currentPage=1;
			}
		});
		$scope.currentPage=1;
	}
	$scope.result_type="both";
}]);
sapp.controller('intentViewController',function($scope){
	
	$scope.x=0;
	$scope.y=0;
	$scope.getPosition=function(item){
		var r=100*item.weight;
		var agl=Math.random()*2 * Math.PI;
		
		var x=Math.round(r*Math.cos(agl));
		var y=Math.round(r*Math.sin(agl));
		//console.log("ang:"+agl+",x:"+x+",y:"+y);
		$scope.x=x;
		$scope.y=y;
	}
});



sapp.controller('resultItemController',['$scope','bookmarks', function($scope, bookmarks){
	
	$scope.isFolded=true;//by default, it's folded
	//$scope.title="title not exceeding give amount of words";
	
	$scope.bookmark=false;//by default, no result item is bookmarked
	
	//check if this item has been bookmarked in previous sessions.
	$scope.checkBookmark=function (item){
		 $scope.bookmark=bookmarks.indexOf(item)<0?false:true;
	}
		
	$scope.toggleBookmark=function(item){	
		//add or remove item from bookmarks
		//$scope.bookmark=!$scope.bookmark;
		bookmarks.toggleBookmark(item, $scope.bookmark);
	};
	$scope.toggleDetails=function(){
		isFolded=!isFolded
	};
	
}]);

sapp.controller('bookmarksController',['$scope','bookmarks', function($scope, bookmarks){
	$scope.items=bookmarks.documents;
	
}]);

sapp.controller('bookmarkItemController',['$scope','bookmarks', function($scope, bookmarks){
	//there is only a remove function
	$scope.visible=true;
	$scope.hideItem=function(){
		visible=false;
	}
	$scope.removeItem=function(item){
		bookmarks.toggleBookmark(item, false);
		//should also update results, if any item has been set as bookmarked
		
	}
}]);

