mapp.factory('memexData', function($http){
	//now: create the factory
	var dummyFactory={};
	
	dummyFactory.oEvents=[];
	dummyFactory.dEvents=[];
	dummyFactory.intents=[];
	dummyFactory.coloredItems=[];//[{"id":documentid, "tag":tag text,"type": tag/document}]
	dummyFactory.coloredIntents=[];//colors are temporally assigned, not stored in databse.
	dummyFactory.getData=function(url){
		return $http.get(url)};
	dummyFactory.info="";
	dummyFactory.focusedTimeRange={start:new Date(),end:new Date()};//selected time range
	dummyFactory.endTime=new Date();
	dummyFactory.beginTime=new Date();//will be changed after initial fetch
	/////////some constances
	
	var itemColors=["#e41a1c","#377eb8","#4daf4a"];//for selected documents or tags
    
	var intentColors=[//for intent 
	"#a6cee3",
	"#b2df8a",
	"#fb9a99",
	"#fdbf6f",
	"#ff7f00",
	"#cab2d6",
	"#6a3d9a"];
	
	dummyFactory.intentColors=intentColors;
	dummyFactory.itemColors=itemColors;
	
	var  Math=window.Math;
	//some private variables  and functions
	
	var keywords = [];
	
	var database={};//pretend this is the database where the events and intents are stored
	
	dummyFactory.initiateData=function(){
		$http.get("data.txt").success(
			function(rawData){
				database=createDummyDataSet(rawData);//should be removed when backend is ready
				//then get the following data:
				dummyFactory.beginTime=database.start;
				dummyFactory.endTime=database.endTime;
			
				//get a subset of the full intents list
				//when real backend is ready, the following should be replaced with:dummyFactory.intents=database.intents
				dummyFactory.intents=database.intents.slice(0,Math.min(15,database.intents.length));
				
				dummyFactory.fetchTimelineEvents();
				
				
				var coloredInt=database.coloredIntents;
				//intiate coloredIntents.
				for (var i=0;i<intentColors.length;i++){
					dummyFactory.coloredIntents[i]=-1;
				}
				//fill in the coloured intents if PIM tool is used to assign colors to intents
				for (var i=0;i<coloredInt.length;i++){
					var ci=intentColors.indexOf(coloredInt[i].colorCode);
					if(ci>0)dummyFactory.coloredIntents[ci]=coloredInt[i].intentId;
				}
				
			}
		);
		
		
	}
	
	dummyFactory.fetchIntents=function(){
		//TODO: this function should be re-written after real backend is ready . 
		//the code below generate a re-ranked list of intents
		if (database["intents"]){
		for (var i=0;i<database.intents.length;i++){
			database.intents[i].weight=Math.random();
			database.intents.sort(function(a, b){return b.weight-a.weight});
		}
		dummyFactory.intents=database.intents.slice(0,Math.min(15,database.intents.length));
		}
	}
	dummyFactory.fetchTimelineEvents=function(criteria){
		//TODO: this function fetches events for timeline circles, then update the weight of events on detailed timeline
		//new events fetched ....
		//temporary code below select 30 items with heighted weight:
		if (database["events"]){
		var el=database.events;
		el.sort(function(a,b){return (b.weight+b.relevance+Math.random())-(a.weight+a.relevance+Math.random())});
		dummyFactory.oEvents=el.slice(0,Math.min(30,el.length));
		}
	}
	dummyFactory.fetchEvents=function(){
		//fetch events according to selected time range
		//otherwise, by default,get the 
		//temporary code below get the top 50 events 
		if (database["events"]){
		var el=database.events;
		el=el.filter(function(e){return e.start>=dummyFactory.focusedTimeRange.start && e.start<=dummyFactory.focusedTimeRange.end});
		dummyFactory.dEvents=el.sort(function(a,b){return b.start-a.start});
		}
	}
	
	dummyFactory.setTempColor=function(intentid){
		//var doUpdate=true;
		var border="";//by default, if no color is available to assign to it 
		var i=dummyFactory.coloredIntents.indexOf(intentid);
		if(i<0){
			//intent does not have a temp color, then apply color		
		// check if there are still color code left, assign it a color code
			if (dummyFactory.coloredIntents.indexOf(-1)<0){
				if (dummyFactory.coloredIntents.length<intentColors.length){
					//register it in coloredIntents list
					dummyFactory.coloredIntents.push(intentid);
					border=intentColors[dummyFactory.coloredIntents.length-1];
				}
				else{
					//border="";
					dummyFactory.info="You can only select up to "+intentColors.length+" intents";
				}
			}
			else{//find an space where an intent has been removed from coloredIntents array
				var blankIndex=dummyFactory.coloredIntents.indexOf(-1);
				//register it in coloredIntents list
				dummyFactory.coloredIntents[blankIndex]=obj.intentid;
				border=intentColors[blankIndex];
			}
			
		}
		else{
			//remove intentid from the coloredIntets list
			dummyFactory.coloredIntents[i]=-1;//assign an invalid id to hold the place
			//border="";
		}	
		return border;
	}
	dummyFactory.getIntentColor=function(intentid){
		if (dummyFactory.intentColors.indexOf(intentid)<0){
			return "";
		}
		else{
			return itemColors[dummyFactory.intentColors.indexOf(intentid)];
		}
	}
	

	
	
	//////////////the following functions are only for creating a fake dataset///////////////
	function createDummyDataSet(rawData){
		//1. this dummy function creats a "fake" database, which contain intents and events, as wells as pre-stored color codes for some intents
		
		var intents=[];
		var  timelineEvents=[];
		var  intentids=[];	
		var  colored_Folder=[];
		var  beginDate=new Date();
		var  endDate=new Date("2011-01-01");
		keywords = [];

		$(rawData).each(function(){
			var obj={};
			obj.weight=(this.feedbackEvents.length+1)*Math.random();
			obj.relevance=Math.random();
			obj.title=this.query;
			var intentid=Math.round(Math.random()*20);
			obj.intent=intentid;
			obj.start=this.start;
			//compare with earliest date
			if(obj.start<beginDate){
				beginDate=obj.start;
			}
			if(obj.start>endDate){
				endDate=obj.start;
			}
			timelineEvents.push(obj);

			//now, push it to intent
			if (intentids.indexOf(intentid)<0){
				//create a new intent
				intentids.push(intentid);
				var newintent={};
				newintent.id=intentid;
				//initiate terms and docs and weight;
				newintent.terms=[];
				newintent.docs=[];
				newintent.weight=Math.random();
				//add terms
				newintent=dummytags(this, newintent);
				//add docs
				newintent=dummydocs(this,newintent);
				//add to intentlist
				intents.push(newintent);
			}
			else{
				//add this event to intent
				var intenti=intents[intentids.indexOf(intentid)];
				//update terms
				intents[intentids.indexOf(intentid)]=dummytags(this, intenti);
				//update docs
				intents[intentids.indexOf(intentid)]=dummydocs(this, intenti);
				}
			});
		
		//mimick: some intents has been assigned with color code through PIM app.
		for (var i=0; i<Math.min(2,intentColors.length);i++){
			intents[i]["colorCode"]=intentColors[i];
			colored_Folder.push({intentId:i, colorCode:intentColors[i]});
		}
		
		return {
			intents:intents,
			events:timelineEvents,
			start:beginDate,
			endTime:endDate,
			coloredIntents:colored_Folder
		};
	}

	function dummytags(cevent, intenti){
		
		for (var i=0; i<cevent.tags.length; i++){
				var tag=cevent.tags[i].text;
				var termIndex=getIndexByField(intenti.terms, "text", tag);
				if (termIndex<0){
					//create term
					var term={};
					term["text"]=tag;
					term["weight"]=Math.random();
					//cevent.tags[i].weight;
					intenti.terms.push(term);
				}
				else{//update term weight
					intenti.terms[termIndex].weight+=Math.random();//cevent.tags[i].weight;
				}
			}
		return intenti;
	}
	function dummydocs (cevent,intenti){
		//1. add docs to intents with weight
		//2. generate dummy result list
		//3. generate dummy keywordlist
		for (var i=0; i<cevent.feedbackEvents.length; i++){
			var doci=cevent.feedbackEvents[i].targettedResource;
			var doctitle="";
			if (doci["title"]){
				doctitle=doci["title"];
			}
			else if (doci["uri"])
				doctitle=doci["uri"].substr(doci["uri"].lastIndexOf("/"));
			var docIndex=getIndexByField(intenti.docs, "title", doctitle);
			
			if (docIndex<0){
				//create doc
				var doc={};
				doc["title"]=doctitle;
				doc["weight"]=Math.random();
				doc["uri"]=doci.uri;
				intenti.docs.push(doc);
				
			}
			else{//update doc weight.
				intenti.docs[docIndex].weight+=1;
			}

			//add to keywords list
			var kws=doci.keywords;
			for (var j=0; j<kws.length;j++){
				//keywordcount++;
				var kwindex=getIndexByField(keywords,"text",kws[j]);
				if (kwindex<0){
					var keyword={};
					keyword["text"]=kws[j];
					keyword["weight"]=1;
					keywords.push(keyword);
				}
				else{
					keywords[kwindex].weight++;	
				}
			}
		}
		return intenti;
	}

	function getIndexByField(array, field, value){
		var index=-1;
		if (array!=null){
			for (var i=0; i<array.length; i++){
				var obj= array[i];
				if (obj.hasOwnProperty(field)){
					if (obj[field]==value){
					index=i;
					break;
					}
				}
			}
		}
		return index;
	}
	return dummyFactory;
});

sapp.factory('searchEngine',function($http){
	var dummyFactory={};
	dummyFactory.getData=function(url){
		return $http.get(url)};
	dummyFactory.results=[];
	dummyFactory.visible_results=function(beginIndex,resultsPerpage){
		//window.console.log(dummyFactory.results);
		//return a copy of segment defined by beginIndex and endIndex
		if (beginIndex>=dummyFactory.results.length){
			return {items:[],eof:true};
		}
		else{ var vlist= dummyFactory.results.slice(beginIndex,Math.min(beginIndex+resultsPerpage, dummyFactory.results.length));

			return {items:vlist, eof:dummyFactory.results.length<=beginIndex+resultsPerpage};
		}	
	};
	return dummyFactory;
});
sapp.factory('bookmarks', function(){
	
	return {documents:[],
		indexOf: function(obj){
			var index=-1;
			for (var i=0; i<this.documents.length;i++){
				//compare obj and documents[i]
				if (this.documents[i].title==obj.title){
					index=i;
					break;
				}
			}
			
			return index;
		}, 
		toggleBookmark: function(obj, addbookmark){
			//check if obj exist in bookmarks;
			if(addbookmark){
				this.documents.push(obj);
			}
			else{			
				var index=this.indexOf(obj);
				this.documents.splice(index,1);
			}
		}
	};	
});