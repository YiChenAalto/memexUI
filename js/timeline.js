//this version uses d3.js API 4.0
mapp.directive('timelinePlot', function ($window) {
    var directiveDefinitionObject = {
        restrict: 'E',
        replace: false,
        scope: { data: '=data', fillColors:'=fillScheme', strokeColors:'=strokeScheme', timelineRange:'=timelineRange', selectedRange:'=brushRange' },
		template:"<svg></svg>",
        link: function (scope, element, attrs, ctrl) {
			
			var brushRange=[];//changed on brush"end" event, to solve the update loop problem caused by transition delay 
			///some constance:
			var default_color="#333";
			var margin = {
				top: 20,
				right: 0,
				bottom: 20,
				left: 80
			};
			var	width = 150;
			
			
		scope.height = $window.innerHeight;//el.clientHeight;
			
			
			/////initiate component
		var svg = d3.select(element[0]).select("svg")
		.attr('width', width)
		.attr('height', scope.height);
			
		var oTimeline=svg.append('g')
		.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
			
		///brush
		var brush = d3.brushY();
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
			 d3.selectAll(".brush").call(brush.clear());
			 scope.selectedRange=null;
		}
			function resize(){
			svg.attr('height', scope.height);
			//oTimeline.attr('height', scope.height);
      		y.rangeRound([scope.height - margin.top - margin.bottom, 0]);
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
			var dataset=scope.data;
			//only updates when data is avaialble
			if(dataset!=null&&dataset.length>1)	{
				//x=weight: importance of the event in history
				var x = d3.scaleLinear()
				.domain([0, d3.max(dataset, function (d) {
					return d.weight;
				})])
				.range([10, 10+width - margin.right - margin.left]);
				
			/*	//update y scale
				
				beginDate=d3.min(dataset, function (d) {
					return new Date(d.start);
				});
				endDate=d3.max(dataset, function (d) {
					return new Date(d.start);
				});
				extendRange_hours=Math.round((endDate.getTime()-beginDate.getTime())/36000000);//extend 10%
				
				beginDate=d3.timeHour.offset(beginDate, -extendRange_hours);
				endDate=d3.timeHour.offset(endDate,extendRange_hours);
				
				y.domain([beginDate, endDate]);*/
				
				
				
			

			//draw  dots to represent events
			oTimeline.selectAll('circle').remove();
			oTimeline.selectAll('circle')
			.data(dataset)
			.enter().append('circle')
			.style('opacity',0.1)
			.style('fill',default_color)
			.style('stroke-width','2')
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
			.attr('r', function (d) {
				var threshold=0.9;
				return (!d.hasOwnProperty("relevance"))||d.relevance<threshold?2:2*Math.round(5*d.relevance);
			})
			.on("mouseover", function(d) {//show thumbnail of snapshot when mouseover
				tooltip.transition()
						.duration(200)
						.style("opacity", 0.9);
				tooltip.html(d.title)
						.style("left", (d3.event.pageX + 5) + "px")
						.style("top", (d3.event.pageY ) + "px");

			})
			.on("mouseout", function(d) {
				tooltip.transition()
						.duration(200)
						.style("opacity", 0);
			})
			.on('click', function(d){
				event.preventDefault();
				event.stopPropagation();
				//show pop out the events
			});
			
			
			}

			//update y axis
			y_axis.call(yAxis);
			//initiate the fill colors
			updateFillColor();
			//clear brush
			//d3.select(this).transition().call(brush.move,[0,0]);
		}
		
		////onChanges to relevance of points
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
			
			for (var i=0;i<scope.strokeColors.length;i++){
				var intentid=scope.strokeColors[i].intent;
				var strokeColor=scope.strokeColors[i].colorCode;
				var classname=".intent"+intentid;
				var selector='circle'+classname;
				oTimeline.selectAll(selector)
					.classed("hasStroke", true)
					.style('opacity',0.5)
					.style('stroke', strokeColor);
			}	
		}	
		
		function updateFillColor(){
			oTimeline.selectAll('circle')
			.style('fill',default_color);
			
			for (var i=0;i<scope.fillColors.length;i++){
				var intentid=scope.fillColors[i].intent;
				var fillColor=scope.fillColors[i].colorCode;
				var classname=".intent"+intentid;
				var selector='circle '+classname;
				oTimeline.selectAll(classname)
					.style('fill', fillColor);
			}	
			
		}
				
		

		function brushend(){
				if (d3.event.sourceEvent){
					var value_end= y.invert(0);
					var	value_start=y.invert(0);
					if(d3.event.selection){
						value_end=y.invert(d3.event.selection[0]);
						value_start=y.invert(d3.event.selection[1]);
					}
					else{
						//if single click instead of draw a range
						var defaultDateOffset=5;
						var cdate = y.invert(d3.mouse(this)[1]);
						//temporally define brush range
						var value_end = d3.timeDay.offset(cdate,defaultDateOffset);
						var value_start =d3.timeDay.offset(cdate,-defaultDateOffset);
						updateBrush(value_start, value_end);
					}
				
					
					
					if(scope.data&&scope.data.length>0){
				
				//highligh selected area
					d3.selectAll("circle").style("opacity", function(d) {
						var eventDate=new Date(d.start);
						// Fade all events not within the brush
						return (eventDate >= value_start && eventDate < value_end) ? 0.2 : 0.05;
					});
					d3.selectAll("circle.hasStroke").style("opacity", function(d) {
						var eventDate=new Date(d.start);
						// Fade all events not within the brush
						return (eventDate >= value_start && eventDate < value_end) ? 1 : 0.5;
					});			
					}
					//update selectedRange in controller
					scope.selectedRange[0]=value_start;
					scope.selectedRange[1]=value_end;
					ctrl.setBrushRange(scope.selectedRange);
				}
			
			
		}
		
			
		function updateBrush(value_start, value_end){
			//d3.select(this).transition().call(brush.move,[Math.max(0,y(value_end)),Math.min(y(value_start),scope.height-margin.top-margin.bottom)]);		
		}	
		
		//when data changes, redraw entire timeline
		scope.$watch('data',redraw);
		
		//when window size changes, redraw entire timeline
		 window.onresize = function() {
			 scope.height=$window.innerHeight;
			 resize();
          };
		///when intent color scheme changes
			
		//scope.$watchCollection('strokeColors',updateStrokeColor);
		//scope.$watchCollection('fillColors',updateFillColor);
		///watch selection of brush range changes made by other elements, e.g event list
		scope.$watchCollection(scope.selectedRange,function(){
			//need to check with this is caused by move brush, or programelly from controller
			if(scope.selectedRange){
				if(scope.selectedRange.length==2){
					updateBrush(scope.selectedRange[0], scope.selectedRange[1]);
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




