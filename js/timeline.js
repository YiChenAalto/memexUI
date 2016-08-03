//this version uses d3.js API 4.0
mapp.directive('timelinePlot', function ($window) {
    var directiveDefinitionObject = {
        restrict: 'E',
        replace: false,
        //scope: { data: '=data', fillColors:'=fillScheme', strokeColors:'=strokeScheme', timelineRange:'=timelineRange', selectedRange:'=brushRange' },
		template:"<svg></svg>",
        link: function (scope, element, attrs) {
			
			var brushRange=[];//changed on brush"end" event, to solve the update loop problem caused by transition delay 
			///some constance:
			var default_color="#666";
			var margin = {
				top: 40,
				right: 20,
				bottom: 10,
				left: 80
			};
			var	width = 150;
			
			
		scope.height = $window.innerHeight;//el.clientHeight;
			
			
			/////initiate component
		var svg = d3.select(element[0]).select("svg")
		.attr('width', width)
		.attr('height', scope.height);
			
		var oTimeline=svg.append('g')
		.attr('transform', 'translate(' + margin.left + ', 0)');
			
		///brush
		var brush = d3.brushY()
		.extent([[0, 0], [width-margin.left, scope.height-margin.top]]);
		oTimeline.append("g")
		.attr("class", "brush")
		.call(brush);
		brush.on('end',brushend);
				
		var beginDate=d3.timeDay.offset(new Date(), -2);
		var endDate=new Date();
		var y = d3.scaleUtc()
			.domain([beginDate, endDate])
			.rangeRound([scope.height - margin.top - margin.bottom, 0]);
		var yAxis = d3.axisLeft(y)
			.tickSize(3)
			.tickPadding(8);
		//draw the timeline*/
		var y_axis=oTimeline.append('g')
			.attr('class', '.y .axis')
			.call(yAxis);
			
		var tooltip = d3.select("body").append("div")
				.attr("class", "tooltip")
				.style("z-index", "10")
				.style("opacity", 0);
		
			
		//resize: resize entire oTimeline, y will be change due to range change, thus all points will be positioned
		function clearbrush(){
			oTimeline.select(".brush").call(brush.move,null);
			//selected range should be the full range
			 scope.brushRange[0]=scope.timelineRange[0];
			 scope.brushRange[1]=scope.timelineRange[1];
		}
			function resize(){
			svg.attr('height', scope.height);
			//oTimeline.attr('height', scope.height);
      		y.rangeRound([scope.height - margin.bottom, 0]);
			//need to reposition brush and points
			redraw();
			//oTimeline.$digest();
		}	
		
		function rescale(){
			//when user zooms in or out, the y domain will change	
			if(scope.timelineRange){
				beginDate=scope.timelineRange[0];
				endDate=scope.timelineRange[1];
				extendRange_hours=Math.round((endDate-beginDate)/36000000);//extend 10%
				
				beginDate=d3.timeHour.offset(beginDate, -extendRange_hours);
				endDate=d3.timeHour.offset(endDate,extendRange_hours);
				
				y.domain([beginDate, endDate]);
			
				redraw();
			}
		}	
			
		function redraw(){
		//this functions is only called when the entire dataset changes
			oTimeline.selectAll('circle').remove();
			var dataset=scope.events;
			//only updates when data is avaialble
			if(dataset!=null&&dataset.length>1)	{
				//x=weight: importance of the event in history
				var x = d3.scaleLinear()
				.domain([0, d3.max(dataset, function (d) {
					return d.weight;
				})])
				.range([10, 10+width - margin.right - margin.left]);
				
			//draw  dots to represent events
		
			oTimeline.selectAll('circle')
			.data(dataset)
			.enter().append('circle')
			.style('opacity',function (d){
				return mapOpacity(d);
			})
			.style('fill',function(d){
				if(d.hasOwnProperty("intentColor"))
				{return d["intentColor"];}
				else {return default_color}
			})
			.style('stroke-width','3')
			.attr('class', function(d){
				if(d.intent)
					return "intent"+d.intent;
				else 
				return "unclassified";
			})
			.attr('cy', function (d) {
				return y(new Date(d.start));
			})
			.attr('cx', function (d) {
				return x(d.weight);
			})
			.attr('r', function(d){ return mapRadius(d)})
			.on("mouseover", function(d) {
				//highligh current item
				d3.select(event.currentTarget)
				.attr("r",10)
				.style('opacity',0.9);
				//find item in eventlist
				scope.toggleAnchorEvent(d);
				
				//show tool tip
				tooltip.transition()
						.duration(200)
						.style("opacity", 0.9);
				tooltip.html(d.title)
						.style("left", (d3.event.pageX + 5) + "px")
						.style("top", (d3.event.pageY ) + "px");

			})
			.on("mouseout", function(d) {
				d3.select(event.currentTarget)
				.attr("r",function(d){ return mapRadius(d)})
				.style('opacity',function(d){ return mapOpacity(d)});
				//remove event highlight
				scope.toggleAnchorEvent(d);
				
				tooltip.transition()
						.duration(200)
						.style("opacity", 0);
			})
			.on('click', function(d){
				event.preventDefault();
				event.stopPropagation();
				//show event in event list
				var anchorEvent=d;
				scope.findAnchorEvent(d);
				//scope.findAchorEvent(d.start)
				
			});
			
			
			}

			//update y axis
			y_axis.call(yAxis);
			//initiate the fill colors
			//updateFillColor();
			//clear brush
			clearbrush();
			//d3.select(this).transition().call(brush.move,[0,0]);
		}
			
		function mapOpacity(d){
				var op=0.1;
				if(d.hasOwnProperty("intentColor"))op=0.5;
				return op;
			}
		function mapRadius(d){
			
			var threshold=0.9;
			return (!d.hasOwnProperty("relevance"))||d.relevance<threshold?2:2*Math.round(5*d.relevance);
			
		}
		////onChanges to relevance of points
		function setFocusedEvent(focusedEvent){
			oTimeline.selectAll('circle')
			.data(focusedEvent)
			.attr('r', function (d) {
				var r=10;
				if (!d.hasOwnProperty("focused"))
					r=mapRadius(d);
				return r;
			})
			.style('opacity',function(){
				var op=1;
				if (!d.hasOwnProperty("focused"))
					op=mapOpacity(d);
				return op;
			});
		}
		function updateRelevance(selected_events){
			oTimeline.selectAll('circle')
			.data(selected_events)
			.attr('r', function (d) {
				return 2+d3.round(5*Math.random());
			})
		}
			
		function updateStrokeColor(){
			//for all items with hasStroke Class, remove the class, and remove the stroke;
			//then add the class and stroke to selected intents only
			oTimeline.selectAll('circle .hasStroke')
			.classed("hasStroke",false)
			.style('opacity',0.05)
			.style('stroke','none');
			
			/*for (var i=0;i<scope.strokeColors.length;i++){
				var intentid=scope.strokeColors[i].intent;
				var strokeColor=scope.strokeColors[i].colorCode;
				var classname=".intent"+intentid;
				var selector='circle'+classname;
				oTimeline.selectAll(selector)
					.classed("hasStroke", true)
					.style('opacity',0.5)
					.style('stroke', strokeColor);
			}	*/
		}	
		
		
				
		

		function brushend(){
			if (d3.event.sourceEvent){
				//initiate var with y position at 0px;
				var value_end= y.invert(0);
				var	value_start=y.invert(0);
				//assign values to var
				if(d3.event.selection){
					value_end=y.invert(d3.event.selection[0]);
					value_start=y.invert(d3.event.selection[1]);
				}
				else{
					//if single click instead of draw a range
					var defaultHourOffset=(scope.timelineRange[1]-scope.timelineRange[0])/36000000;//10% the hieght
					var cdate = y.invert(d3.mouse(this)[1]);
					//temporally define brush range
					var value_end = d3.timeHour.offset(cdate,defaultHourOffset);
					var value_start =d3.timeHour.offset(cdate,-defaultHourOffset);
					updateBrush(value_start, value_end);
				}


				if(scope.events&&scope.events.length>0){
				//highligh selected area
					svg.selectAll("circle").style("opacity", function(d) {
						var eventDate=new Date(d.start);
						// Fade all events not within the brush
						var op=0.05;
						if(d.hasOwnProperty("intentColor"))op=0.3;
						var hop=Math.min(1,op*4);
						return (eventDate >= value_start && eventDate < value_end) ?  hop: op;
					});
						
				}
				//update brushRange in controller
				scope.updateSelectedRange(value_start,value_end);
			}		
		}
		
			
		function updateBrush(value_start, value_end){
			oTimeline.select(".brush").call(brush.move,[Math.max(0,y(value_end)),Math.min(y(value_start),scope.height)]);	
		}	
		
		//when data changes, redraw entire timeline
		scope.$watch(scope.events,redraw);
		
		//when window size changes, redraw entire timeline
		 window.onresize = function() {
			 scope.height=$window.innerHeight-margin.top;
			 resize();
          };
		///when intent color scheme changes
			
		//scope.$watchCollection('strokeColors',updateStrokeColor);
		//scope.$watchCollection(scope.coloredIntents,redraw);
		///watch selection of brush range changes made by other elements, e.g event list
		scope.$watch(
			function(){
				return scope.brushRange[1]-scope.brushRange[0];
			},
			function(){
			if(scope.brushRange){
				if(scope.brushRange.length==2){
					updateBrush(scope.brushRange[0], scope.brushRange[1]);
				}
			}
		});
			//happends after zoom
		scope.$watchCollection(
			function(){
				//console.log(scope.timelineRange);
				return scope.timelineRange
			},
			rescale);
			

     }};
		
    return directiveDefinitionObject;
});




