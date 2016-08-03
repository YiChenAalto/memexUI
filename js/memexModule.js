var mapp=angular.module("memex",[]);//responsible for history part

mapp.controller('timelineController',['$scope','memexData',function($scope,memexData) {
    $scope.events =[];
	//list of color schemes: {intentid:id, color:color: styleKey:"border" or "background"}
	
	$scope.intentColors=[];
	$scope.itemColors=[];
	$scope.zoomLabel="in";
	$scope.EnableZoomeIn=false;
	$scope.EnableZoomeOut=false;
	$scope.brushRange=[];
	$scope.timelineRange=[];
	
	
	var initDate=(new Date()).getTime();
	$scope.brushRange=[initDate,initDate];//only changed through timeline directive
	$scope.maxRange=[initDate,initDate];
	$scope.timelineRange1=[initDate,initDate];

	//function called through other UI components programmly.	
	$scope.setBrushRange=function(){	
		
		$scope.brushRange=[memexData.focusedTimeRange.start,memexData.focusedTimeRange.end];
		//if newRange<zoom range
		checkZoomable();
		
		
	}
	
	//function called when brush range is changed from timeline brush action

	$scope.updateSelectedRange=function(value_start,value_end){
		//console.log($scope.brushRange);
		$scope.brushRange=[value_start,value_end];
		checkZoomable();
		//update the brush range in factory, so that event list can be updated
		memexData.focusedTimeRange.start=value_start;
		memexData.focusedTimeRange.end=value_end;
		memexData.fetchEvents();//will update the event list 
		//$scope.$apply();
		
	}
	$scope.$watch(
		function(){
			return memexData.focusedTimeRange.start+memexData.focusedTimeRange.end-$scope.brushRange[0]-$scope.brushRange[1];
		},
		function(){
		if(memexData.focusedTimeRange.start!=$scope.brushRange[0] || memexData.focusedTimeRange.end!=$scope.brushRange[1]){
			//means the focusedTimeRange is not updated by timeline control brush action, but by other things, e.g. the range of events on event list.So we need to update the brushrange
			$scope.brushRange=[memexData.focusedTimeRange.start,memexData.focusedTimeRange.end];
			//then this should trigger brush move event in timeline directive
			}
		}
	);
	function checkZoomable(){	
		if((($scope.brushRange[1]-$scope.brushRange[0])>0)&&(($scope.brushRange[1]-$scope.brushRange[0])<($scope.timelineRange[1]-$scope.timelineRange[0]))){
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
			$scope.timelineRange[0]=$scope.maxRange[0];
			$scope.timelineRange[1]=$scope.maxRange[1];
			$scope.EnableZoomeOut=false;
		}
		else{
			//zoom in
			$scope.timelineRange[0]=$scope.brushRange[0];
			$scope.timelineRange[1]=$scope.brushRange[1];
			$scope.EnableZoomeOut=true;
			$scope.EnableZoomeIn=false;
		}
		//then update event
		var events_in_range= memexData.getTimelineEventsInRange($scope.timelineRange)
		$scope.events=events_in_range;//then it will trigger update to timeline 
	}
	
	$scope.clearTimeline=function(){
		//memexData.clearColorScheme();
		memexData.clearTempColors();
		memexData.oEvents=[];//will trigger re-draw function, in which all circles will be removed, brush will be cleared un re-draw.
		memexData.dEvents=[];
		$scope.$apply();
	}
	
	$scope.toggleAnchorEvent=function(e){
		memexData.toggleFocusedEvent(e);
		$scope.$apply();
	}
	
	
	$scope.findAnchorEvent=function(e){
		//e: event object
		//if e is not not in current focused range (not shown on detail timeline), then fetch event from that time
		
		if(e.start<memexData.focusedTimeRange.start || e.start>memexData.focusedTimeRange.end)
			{
				memexData.focusedTimeRange.start=e.start;
				memexData.focusedTimeRange.end=e.start;
				memexData.fetchEvents();
				//now get new range for brush;
				var elist=memexData.dEvents;
				if (elist.length>1){
					memexData.focusedTimeRange.start=elist[0].start;
					memexData.focusedTimeRange.end=elist[elist.length-1].start;
					$scope.setBrushRange();
				}
				
			}
		else{
			// don't updateEvents
		}
		//memexData.focusedEventIndex=;
		//then highlight the event, e.g. set class to it , then remove its class
		//$scope.$digest();
		
	}
	//when data changes
	$scope.$watchCollection(function(){return memexData.oEvents},
				  function(){
		if (memexData.oEvents.length>0)
			$scope.events=memexData.oEvents;
		}
	)
	
	$scope.$watch(
		function(){return memexData.beginTime},
		function(){
			
			$scope.maxRange[0]=memexData.beginTime;
			$scope.maxRange[1]=memexData.endTime;
			//change zoom range, so that it will shows the max range
			$scope.timelineRange[0]=memexData.beginTime;
			$scope.timelineRange[1]=memexData.endTime;
			$scope.EnableZoomeOut=false;

		})

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
		memexData.fetchIntents();
	}
	$scope.$watchCollection(
		function(){		
			return memexData.intents;
		},
		function(){
			$scope.intents=memexData.intents;
	})
	$scope.$watch(function(){return memexData.info},function(){$scope.alertMessage=memexData.info;})
	
	$scope.clearColors=function(){
		//remove all tempcolors
		memexData.clearTempColors();
		//remove all oevents, and colors of events on eventlist

	}
	
}]);

//controls a single li
mapp.controller("intentController", ['$scope','memexData',  function($scope, memexData){
	//controller historical intent list
	$scope.borderCode="";
	$scope.backgroundCode="";
	$scope.isFolded=true;//show summary=true; show more items=false
	$scope.intent={};
	$scope.facets=[];
	
	$scope.toggleDetail=function(){
		$scope.isFolded=!$scope.isFolded;
		$scope.facets=getFacets();
	}
	$scope.initCtrl=function(intenti){
		$scope.intent=intenti;
		$scope.facets=getFacets();
		if(intenti.hasOwnProperty("id")){
			var hexstr=memexData.getIntentColor(intenti["id"]);
			$scope.backgroundCode=getBackgroundColor(hexstr);
		}		
	}
	$scope.setTempColor=function(){	
		//the temp color is only assigned after set ation, so no seperate getTemp color is needed here
		if ($scope.intent.hasOwnProperty("id")){
			var intentid=$scope.intent.id;
			var bcolor=memexData.setIntentColor(intentid,false);
			$scope.backgroundCode=getBackgroundColor(bcolor);
			$scope.$apply();
		}
	};
	function getBackgroundColor(hexstr){
		var bcode="";
		if (hexstr.length==7)
		{//conver hexstr to rgba
			var r=parseInt(hexstr.substr(1,2),16);
			var g=parseInt(hexstr.substr(3,2),16);
			var b=parseInt(hexstr.substr(5,2),16);
			bcode="background:rgba("+r+","+g+","+b+",0.5);";
		}
		return bcode;
	}
	$scope.positiveFeedback=false;
	$scope.togglePositiveRelevance=function(){
		$scope.positiveFeedback=!($scope.positiveFeedback);
		if($scope.positiveFeedback)
		{setRelevance(1)}
		else 
		{setRelevance(0)};
	}
	function setRelevance(r){
		//this would affect border left color
		//1=relevant; 0=default; -1=negative
		bordercolor="";
		switch(r){
			case 1:bordercolor="green";break;
			case -1:bordercolor="red";break;
		}
		
		if(bordercolor!=""){
			$scope.backgroundCode="border-left: 3px solid "+bordercolor+";"
			}
			else{
				$scope.borderCode="";//remove border;
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
			htmlstr=htmlstr+"<div class='placeHolder'>loading...</div>";
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
	var initTime=(new Date()).getTime();
	$scope.events=[];
	$scope.timeRange=memexData.focusedTimeRange;
	$scope.dataLoaded=false;
	$scope.colorScheme=[];
	//$scope.selectTime=initTime;
	$scope.tooltip={
		y:0,
		visible:false,
		label:""
	};
	$scope.toggleToolTip=function(eventi){
		if($scope.tooltip.visible){
			$scope.tooltip.visible=false;
		}
		else{
			$scope.tooltip.visible=true;
			$scope.tooltip.y=event.pageY;
			$scope.tooltip.label=formatDate(eventi.start);
		}
		//$scope.selectTime=eventi.start;
	}
	function formatDate(ms){
		return (new Date(ms)).toLocaleDateString();
	}
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
	
	$scope.$watch(function(){
		return memexData.dEvents;
	},function(){
		$scope.events=memexData.dEvents;
		if ($scope.events.length>0){
			$scope.dataLoaded=true;
		} 		
	});
	$scope.focusedIndex=-1;
	$scope.$watch(function(){
		return memexData.focusedEventIndex;
	},function(){
		$scope.focusedIndex=memexData.focusedEventIndex;
		//then should trigger scroll event from scrollList directive
	})
	
	
}]);

mapp.directive("scrollList", function () {
    var scrollDirective={
		restrict: 'E',
        replace: false,
        link: function (scope, element, attrs) {
			scope.$watch(scope.focusedIndex, function(){
				//scroll to selected item
				if(scope.focusedIndex>=0){
					$(element[0]).animate({
					 scrollTop: $($(element[0]).find(li)[scope.focusedIndex]).position().top
					}, 'slow');
				}
				
			})
		}
	};
	return scrollDirective;
});

mapp.controller("eventItemController",function($scope){
	
	$scope.data={};//this is not changed after the eventi change, as the eventi change did not trigger anyupdate to $scope.data; so this should be moved to a directive?
	
	$scope.getIntentIconStyle=function(intent){
		var h=intent["r"]*100;
		h="height:"+h+"%;";
		var bcolor="background-color:"+intent["color"]+";";
		return h+bcolor;
	}
	$scope.isFocused=false;
	$scope.$watch(function(){
		return($scope.data.hasOwnProperty("focused"));
	},
		function(){
		if($scope.data.hasOwnProperty("focused")){
			$scope.isFocused=true;
		}
		else{
			$scope.isFocused=false;
		}
	})
})
mapp.directive("zoomableLi", function(){
	var obj = {
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
				if(eventi.hasOwnProperty("coloredIntents")){
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
