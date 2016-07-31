var mapp=angular.module("memex",[]);//responsible for history part

mapp.value("coloredIntents", []);//ids of intent, index corresponds to the index in intentcolors
mapp.value("intentColors",["#e41a1c","#377eb8","#4daf4a"]);//for temporally use during the tasks only
mapp.value("folderColors",[
	"#a6cee3",
	"#b2df8a",
	"#fb9a99",
	"#fdbf6f",
	"#ff7f00",
	"#cab2d6",
	"#6a3d9a"
]);




mapp.controller('timelineController',['$scope','memexData',function($scope,memexData) {
    $scope.events =[];
	//list of color schemes: {intentid:id, color:color: styleKey:"border" or "background"}
	
	$scope.intentColors=[];
	$scope.itemColors=[];
	$scope.zoomLabel="in";
	$scope.EnableZoomeIn=false;
	$scope.EnableZoomeOut=false;
	$scope.brushRange=[];
	$scope.zoomRange=[];
	
	
	var initDate=(new Date()).getTime();
	$scope.brushRange=[initDate,initDate];//only changed through timeline directive
	$scope.timelineRange=[initDate,initDate];
	$scope.zoomRange1=[initDate,initDate];

	//function called through other UI components programmly.	
	$scope.setBrushRange=function(newRange){
		
		if (newRange!=null&&(newRange[1]>newRange[0])){
			$scope.brushRange=newRange;
			//if newRange<zoom range
			checkZoomable();
		}
	}
	
	//function called when brush range is changed from timeline brush action
	$scope.$watchCollection($scope.brushRange,function(){
		console.log($scope.brushRange);
		if($scope.brushRange!=null&&$scope.brushRange.length==2){
			checkZoomable();
			//update the brush range in factory, so that event list can be updated
			memexData.focusedTimeRange.start=$scope.brushRange[0];
			memexData.focusedTimeRange.end=$scope.brushRange[1];
			memexData.fetchEvents();//will update the event list 
		}
	});

	function checkZoomable(){	
		if((($scope.brushRange[1]-$scope.brushRange[0])>0)&&(($scope.brushRange[1]-$scope.brushRange[0])<($scope.zoomRange[1]-$scope.zoomRange[0]))){
				//can still zoom in
			$scope.EnableZoomeIn=true;
			}
		else{
			$scope.EnableZoomeIn=false;
		}
	}
	
	
	$scope.zoomin=function(){zoom(true)};
	$scope.zoomout=function(){zoom(false)};
	function zoom(zoomin){
		if(!zoomin){
			//zoom out
			$scope.zoomRange[0]=$scope.timelineRange[0];
			$scope.zoomRange[1]=$scope.timelineRange[1];
			$scope.EnableZoomeOut=false;
		}
		else{
			//zoom in
			$scope.zoomRange[0]=$scope.brushRange[0];
			$scope.zoomRange[1]=$scope.brushRange[1];
			$scope.EnableZoomeOut=true;
			$scope.EnableZoomeIn=false;
		}
		//then update event
		var events_in_range=memexData.oEvents.filter(function(e){
			return e.start>=$scope.zoomRange[0]&&e.start<=$scope.zoomRange[1]
		})
		$scope.events=events_in_range;//then it will trigger update to timeline 
	}
	
	$scope.clearTimeline=function(){
		memexData.oEvents=[];//will trigger re-draw function, in which all circles will be removed, brush will be cleared un re-draw.
	}
	//when data changes
	$scope.$watch(function(){return memexData.oEvents},
				  function(){
		if (memexData.oEvents.length>0)
			$scope.events=memexData.oEvents;
		}
	)
	
	$scope.$watch(
		function(){return memexData.beginTime},
		function(){
			
			$scope.timelineRange[0]=memexData.beginTime;
			$scope.timelineRange[1]=memexData.endTime;
			//change zoom range, so that it will shows the max range
			$scope.zoomRange[0]=memexData.beginTime;
			$scope.zoomRange[1]=memexData.endTime;
			$scope.EnableZoomeOut=false;

		})
	//when color scheme in memexData factory changes, 
	/*
	$scope.$watchCollection(
		function(){
			return memexData.coloredFolders;
		},
		function(){
			var newarr=[];
			var arr=memexData.coloredFolders;
			for (var i=0;i<arr.length;i++){
				if (arr[i]>=0)
				{var obj={};
				obj["intent"]=arr[i];
				obj["colorCode"]=memexData.fixColors[i];
				newarr.push(obj);}
			}
			$scope.intentColors=newarr;
		}
	);
	$scope.$watchCollection(
		function(){
			return memexData.coloredIntents;
		},
		function(){
			var newarr=[];
			var arr=memexData.coloredIntents;
			for (var i=0;i<arr.length;i++){
				if(arr[i]>=0)
				{var obj={};
				obj["intent"]=arr[i];
				obj["colorCode"]=memexData.tempColors[i];
				newarr.push(obj);}
			}
			$scope.tempColors=newarr;
		}
	);
	*/
	
	//when window resize, the svg will resize accordingly
	angular.element(this).on('resize', function(){ $scope.$apply() })
}]);


mapp.controller("intentListController", ['$scope','memexData',function($scope,memexData){
	//controller historical intent list
	$scope.intents=[];
	$scope.alertMessage="";
	
	$scope.getIntent=function(){	
	memexData.initiateData();
	}
	$scope.updateIntent=function(){	
	memexData.fetchEvents();
	}
	$scope.$watchCollection(
		function(){		
			return memexData.intents;
		},
		function(){
			$scope.intents=memexData.intents;
	})
	$scope.$watch(function(){return memexData.info},function(){$scope.alertMessage=memexData.info;})
	
}]);

//controls a single li
mapp.controller("intentController", ['$scope','memexData',  function($scope, memexData){
	//controller historical intent list
	$scope.borderCode="";
	$scope.backgroundCode="";
	$scope.isFolded=true;//show summary=true; show more items=false
	$scope.intent={};
	$scope.facets=[];
	
	$scope.toggle=function(){
		isFolded=!isFolded;
		$scope.facets=getFacets();
	}
	$scope.initCtrl=function(intenti){
		$scope.intent=intenti;
		$scope.facets=getFacets();
		if(intenti.hasOwnProperty("id")){
			getBackgroundColor(intenti["id"]);
		}		
	}
	$scope.setTempColor=function(){	
		//the temp color is only assigned after set ation, so no seperate getTemp color is needed here
		if ($scope.intent.hasOwnProperty("id")){
			var intentid=$scope.intent.id;
			var bordercolor=memexData.setTempColor(intentid);
			if(bordercolor.length>0){
			$scope.borderCode="border: 1px solid "+bordercolor+";"
			}
			else{
				$scope.borderCode="";//remove border;
			}
		}
	};
	function getBackgroundColor(intentid){
		var hexstr=memexData.getIntentColor(intentid);
		if (hexstr.length==7)
		{//conver hexstr to rgba
			var r=parseInt(hexstr.substr(1,2),16);
			var g=parseInt(hexstr.substr(3,2),16);
			var b=parseInt(hexstr.substr(5,2),16);
			$scope.backgroundCode="background:rgba("+r+","+g+","+b+",0.5);";
		}	
	}
	
	function getFacets(){
		
		var number_docs=20;
		var number_terms=50;
		if($scope.isFolded){
			//return the top N terms and documents
			number_docs=3;
			number_terms=10;
		}
		//console.log($scope.intent.terms.length+$scope.intent.docs.length);
		$scope.intent.terms.sort(function(a, b){return b.weight-a.weight});
		$scope.intent.docs.sort(function(a, b){return b.weight-a.weight});
		var terms=$scope.intent.terms.slice(0,Math.min($scope.intent.terms.length,number_terms));
		var docs=$scope.intent.docs.slice(0,Math.min($scope.intent.docs.length,number_docs));
		
		var items= terms.concat(docs);
		return items;
		
	}

}]);



mapp.controller("intentElementController", function ($scope){
	//controlls individual items in each intent
	var maxURL_length=20;
	$scope.onFeedback=function(feedback){
		if(feedback){
			//positive feedback
			
		}
		else{
			//negative feedback
		}
	}
	
	$scope.getStyle=function(weight){
		var fontsize=Math.min(10,10*Math.round(weight));
		var textcolor="#aaa";
		if (weight>2)textcolor="#333";
		return "font-size:"+fontsize+"px; color:"+textcolor;
	}
	$scope.getContent=function(item,maxTitle_length ){
		var text="";
		if (item.hasOwnProperty("text")){text=item.text;}
			
		else if(item.hasOwnProperty("title")){text=item.title;}
		else if(item.hasOwnProperty("uri")){text=item["uri"].substr(edoc.uri.lastIndexOf("/")+1)}
		if(maxTitle_length>0&&text.length>maxTitle_length){
			text=text.substr(0,maxTitle_length)+"...";
		}
		return text;
	}
	$scope.popoverContent=function(item){
		
		var htmlstr="";
		htmlstr=htmlstr+"<div class='title'>"+$scope.getContent(item,0)+"</div>";
		if(item.hasOwnProperty("uri")){
			var url=item["uri"];
			var shortend_url=url;
			if (shortend_url.length>maxURL_length){
				shortend_url=shortend_url.substr(0,maxURL_length)+"...";
			}
		   htmlstr=htmlstr+"<p><a class='url' href='"+url+"'>"+shortend_url+"</a></p>";
			htmlstr=htmlstr+"<div>loading content...</div>";
	 	}
		htmlstr=htmlstr+"<div><button class='btn btn-success positiveFeedback'><span class='glyphicon glyphicon-star'></span> Yes</button><button class='btn btn-danger negativeFeedback' ng-click=''> <span class='glyphicon glyphicon-ban-circle'></span> No</button></div>";
		return htmlstr;
	}
});
mapp.directive("popoverItem", function(){
	return {
		restrict: 'A',
        //template: '',
        link: function (scope, el, attrs) {
           
            $(el).popover({
                trigger: 'focus',
                html: true,
                content: attrs.popoverContent,
                placement: "right"
            });
        }
	}
})
mapp.controller("eventListController",['$scope','memexData',function($scope,memexData){
	var maxEventPerPage=50;//need to tune this
	$scope.events=[];
	$scope.timeRange={start:'yestoday', end:'today'};
	$scope.dataLoaded=false;
	$scope.colorScheme=[];
	
	
	//"fisheye"
	var fishEyeRange=10;//=number of items around the target that will 
	$scope.applyFishEye=function(index){
		//change the size of item and its surrounding
		//get fisheye effect
		for (var i=Math.max(0,index-fishEyeRange);i<Math.min($scope.events.length,index+fishEyeRange);i++){
			$scope.events[i]["temp_weight"]=$scope.events[i].weight*fishEyeWeight(index-i);
		}
	}
	$scope.removeFishEye=function(index){
		for (var i=Math.max(0,index-fishEyeRange);i<Math.min($scope.events.length,index+fishEyeRange);i++){
			if($scope.events[i].hasOwnProperty("temp_weight"))
			delete $scope.events[i].temp_weight;
		}
	}
	function fishEyeWeight(distance_from_target){
		return Math.ceil(fishEyeRange/(1+distance_from_target));//1+5*Math.exp(-Math.pow(distance_from_target,2));
	}
	$scope.$watch(function(){return memexData.dEvents},function(){
		$scope.events=memexData.dEvents;
		if ($scope.events.length>0){
			$scope.dataLoaded=true;
		} 		
	});
	
	$scope.$watchCollection(memexData.coloredIntents,function(){
		
	});
}])
mapp.controller("eventItemController",function(){
	
})
mapp.directive("zoomableLi", function(){
	obj = {
        restrict: 'A',
        scope: { data: '=data' },
        link: function (scope, element, attrs) {
			
			scope.itemSize="";
			
			function getSize(){
				var eventi=scope.data;
				var minFontSize=8;
				var maxFontSize=20;
				var w=eventi.weight;
				if (eventi.hasOwnProperty("temp_weight")){
					w=eventi.temp_weight;
				}
				var intenti=eventi.intent;


				//if it is a selected intent, the font should be a bit bigger

				//return font size based on w
				var fontsize=w* 10;
				if(eventi.hasOwnProperty("intentColor")){
					fontsize=fontsize+2;
				}
				if(eventi.hasOwnProperty("tempColor")){
					fontsize=fontsize+2;
				}
				
				fontsize=Math.round(	Math.min(maxFontSize,Math.max(minFontSize,fontsize)));
				return fontsize;

			}
			
			scope.$watch(
				function(){
					var tw=0;
					if (scope.data.hasOwnProperty("temp_weight")){
						tw=scope.data.temp_weight;
						}
						return tw;
				},
						 function(){
				scope.itemSize=getSize();
						//console.log(scop.itemstyle);
				element[0].style.fontSize=scope.itemSize+"px";
				//scope.$digest();
			})
		} 
	}
	return obj;
})
mapp.directive("scroll", function ($window) {
    return function(scope, element, attrs) {
       /* element.bind("scroll", function() {
            //get the first and last visible item which has 
            scope.$apply();
        });*/
    };
});