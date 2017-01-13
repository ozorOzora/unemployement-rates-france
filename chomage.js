var trimestres=[
"_2005T1",
"_2005T2",
"_2005T3",
"_2005T4",
"_2006T1",
"_2006T2",
"_2006T3",
"_2006T4",
"_2007T1",
"_2007T2",
"_2007T3",
"_2007T4",
"_2008T1",
"_2008T2",
"_2008T3",
"_2008T4",
"_2009T1",
"_2009T2",
"_2009T3",
"_2009T4",
"_2010T1",
"_2010T2",
"_2010T3",
"_2010T4",
"_2011T1",
"_2011T2",
"_2011T3",
"_2011T4",
"_2012T1",
"_2012T2",
"_2012T3",
"_2012T4",
"_2013T1",
"_2013T2",
"_2013T3",
"_2013T4",
"_2014T1",
"_2014T2",
"_2014T3",
"_2014T4",
"_2015T1",
"_2015T2",
"_2015T3",
"_2015T4",
"_2016T1",
"_2016T2"]

//chargement du fichier data, une fois le fichier chargé, on exécute la fonction ready
queue()
    .defer(d3.tsv, "chomageRegionTrimestre.tsv")
    .await(ready);

//la fonction ready reçoit la donnée sous forme d'un tableau d'objets.
function ready(error, data){
	var dataFrance;
	var dataByRegion=[];
    data.forEach(function(d, index) {

	    var dataTrimestres = [];
	    for(var i=0; i<trimestres.length; ++i){
		    d[trimestres[i]] = +d[trimestres[i]];
		    dataTrimestres.push({ "value" : d[trimestres[i]]});
	    }
	    if(index == 0) dataFrance = dataTrimestres;
	    dataByRegion.push({"region" : d.region ,dataTrimestres});
    	});

	var graphLenNum = 7;

	//On défini les dimensions du graph
	var graphWidth = 1200,
		margin = 10,
		titleMargin = 50,
		oneGraphWidth = graphWidth/graphLenNum - margin,
		oneGraphHeight = 200+titleMargin,
		graphHeight = Math.ceil(data.length/graphLenNum) * (oneGraphHeight+margin);

	//la variable chart est un objet contenant la div graph-chomage, on y ajoute un svg.
	var chart = d3.select(".graph-chomage").append("svg")
		.attr("width", graphWidth)
		.attr("height", graphHeight);

	var svg = chart.selectAll("g")
		.data(dataByRegion)
		.enter().append("g")
		.attr("class", function(d, i){return "graph-" + d.region})
		.attr("transform", function(d, i){ return "translate(" + (i%graphLenNum)*(oneGraphWidth+margin) + "," + Math.floor(i/graphLenNum)*(oneGraphHeight+margin) + ")"});

	var x = d3.scaleLinear().domain([0, trimestres.length]).range([0, oneGraphWidth]);
	var y = d3.scaleLinear().domain([3, 15]).range([oneGraphHeight,titleMargin]);

	var valueline = d3.line()
	    .x(function(d,i){return x(i);})
	    .y(function(d,i){return y(d.value);});


	svg.append("rect")
		.attr("class", "graph-background")
		.attr("y", 0)
		.attr("width", oneGraphWidth)
		.attr("height", oneGraphHeight)

	svg.append("path")
		.datum(dataFrance)
		.attr("class", "soft-line")
		.attr("d",  valueline);

	svg.append("path")
		.datum(function(d){return d.dataTrimestres;})//Point clef de notre multigraph.
		.attr("class", function(d, i) {
			if(i==0) { console.log(d); return "line";}
			else return "red-line";
		})
		.attr("d", valueline);


	svg.append("text")
		.attr("class", "region-title")
		.attr("transform", "translate(" + oneGraphWidth/2 + ", " + 30 + ")")
		.attr("text-anchor","middle")
		.text(function(d){return d.region});

	svg.append("rect")
		.attr("class", "overlay")
		.attr("y", 0)
		.attr("width", oneGraphWidth)
		.attr("height", oneGraphHeight)
		.on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseout", mouseout);

	svg.append("circle")
		.datum(function(d){return d.dataTrimestres;})
		.attr("class",function(d, i){
			if(i!=0)return "overlay-circle red-circle";
			else return "overlay-circle";
		})
	    .attr("r", 3.5)
	    .attr("transform", function(d) { return "translate(" + x(trimestres.length-1) + "," + y(d[trimestres.length-1].value) + ")"; });
	    //.style("display", "none");

	svg.append("text")
		.datum(function(d){return d.dataTrimestres;})
		.attr("class", "overlay-value")
		.attr("font-weight", "bold")
		.call(valueLabel, trimestres.length-1);

	svg.append("text")
		.datum(function(d){return d.dataTrimestres;})
		.attr("class", "overlay-year")
		.attr("font-weight", "bold")
		.call(yearLabel, trimestres.length-1);

	function valueLabel(text, valueIndex){
		text.each(function(d, i){
			var text = d3.select(this),
				min = Math.max(0, valueIndex - 15),
				max = Math.min(d.length-1, valueIndex + 15);

			var vicinity = [];

			for(i=min; i<=max; i++){
				vicinity.push(d[i].value);
			}
			//console.log( vicinity);

			text.text(function(d){return d3.format('.1f')(d[valueIndex].value) + "%"});

			var ratio = valueIndex/trimestres.length;
			var bbox = text.node().getBBox();
			text.attr("transform", function(d){ return "translate(" + (x(valueIndex) - bbox["width"]*ratio) + ","
				+ (y(d3.max(vicinity))-15)
				+ ")"})

		});
	}

	function yearLabel(text, valueIndex){

		var ratio = valueIndex/trimestres.length;
		text.text( trimestres[valueIndex].slice(1,5));
		var bbox = text.node().getBBox();

		text.attr("transform", "translate(" + (x(valueIndex) - bbox["width"]*ratio  ) + "," + (oneGraphHeight-10)  + ")");


	}

	function mousemove(){
		var valueIndex = Math.max(Math.min(Math.floor(d3.mouse(this)[0]/oneGraphWidth*trimestres.length), trimestres.length-1),0);
		svg.selectAll(".overlay-circle")
		.attr("transform", function(d) { return "translate(" + x(valueIndex) + "," + y(d[valueIndex].value) + ")"; });
		svg.selectAll(".overlay-value").call(valueLabel, valueIndex);
		svg.selectAll(".overlay-year").call(yearLabel, valueIndex);
	}

	function mouseover(){
		mousemove.call(this);
	}

	function mouseout(){
		console.log("OUT");
		svg.selectAll(".overlay-circle")
		.attr("transform", function(d) { return "translate(" + x(trimestres.length-1) + "," + y(d[trimestres.length-1].value) + ")"; });
		svg.selectAll(".overlay-value").call(valueLabel, trimestres.length-1);
		svg.selectAll(".overlay-year").call(yearLabel, trimestres.length-1);

	}


}
