//this version uses d3.js API 4.0
mapp.directive('timelinePlot', function ($window) {
    var directiveDefinitionObject = {
        restrict: 'E',
        replace: false,
        scope: { data: '=data', fillColors:'=fillScheme', strokeColors:'=strokeScheme' },
		template:"<svg></svg>",
        link: function (scope, element, attrs) {
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
		function resize(){
			svg.attr('height', scope.height);
			//oTimeline.attr('height', scope.height);
      		y.rangeRound([scope.height - margin.top - margin.bottom, 0]);
			//need to reposition brush and points
			redraw();
			//oTimeline.$digest();
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
				
				//update y scale
				
				beginDate=d3.min(dataset, function (d) {
					return new Date(d.start);
				});
				endDate=d3.max(dataset, function (d) {
					return new Date(d.start);
				});
				extendRange_hours=Math.round((endDate.getTime()-beginDate.getTime())/36000000);//extend 10%
				
				beginDate=d3.timeHour.offset(beginDate, -extendRange_hours);
				endDate=d3.timeHour.offset(endDate,extendRange_hours);
				
				y.domain([beginDate, endDate]);
				
				
				
			

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
			if(scope.data&&scope.data.length>0){
				var defaultDateOffset=5;
				//only do this if this function is not call programmically
				if (d3.event.sourceEvent){
					var cdate = y.invert(d3.mouse(this)[1]);
					//temporally define brush range
					var value_end = d3.timeDay.offset(cdate,defaultDateOffset);
					var value_start =d3.timeDay.offset(cdate,-defaultDateOffset);
					//var value_end = y.invert(d3.event.selection[0]);
					//var value_start =y.invert(d3.event.selection[1]);
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
					d3.select(this).transition().call(brush.move,[Math.max(0,y(value_end)),Math.min(y(value_start),scope.height-margin.top-margin.bottom)]);
				}
				}
			}
			
			
		scope.adjust_brush=function(value0, value1){
			//adjust brush size accoding to time range of events presented
				brush.extent([value0, value1]);
				brush(d3.select(".brush").transition());
				brush.event(d3.select(".brush").transition().delay(1000));
			}
		//when data changes, redraw entire timeline
		scope.$watch('data',redraw);
		
		//when window size changes, redraw entire timeline
		 window.onresize = function() {
			 scope.height=$window.innerHeight;
			 resize();
          };
		///when intent color scheme changes
			
		scope.$watch('strokeColors',updateStrokeColor);
		scope.$watch('fillColors',updateFillColor);
		

     }};
		
    return directiveDefinitionObject;
});




