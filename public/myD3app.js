import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

//constants
const maxHeadlineLength = 30;
const maxRowLength = 25;

//variable containing reference to data
var data;

const By = {
  Name: "name",
  Playtime: "playtime",
  Userscore: "userscore",
  Popularity: "popularity"
};

//D3.js canvases
var buttonArea;
var barChartArea;
var detailArea;
var tableArea;

//variables for selection
var selectedGameId;
var chosenGameData;
var prevChosenGameData;

//color scale
var myColorScale;



//variables for precomputed values
var topValue; //top value in all the data
var labelWidth; //gap size for heatmap row labels
var barWidth; //width of one bar/column of the heatmap

let gameId = 0;

/*Loading data from CSV file and editing the properties to province codes. Unary operator plus is used to save the data as numbers (originally imported as string)*/
d3.csv("./public/steam-library1.csv", function(d) {
  return {
    name: d["game"],
    hours: +d["hours"],
    userscore: +d["userscore"],
    popularity: +d["userscore_count"],
    release_date: d["release_date"],
    id: gameId++,
    //multiplayer: d["multiplayer any"],
  }
})
  .then(function(csvData) {
    //store loaded data in global variable
    data = csvData;
    
    // TODO: takto sortovať:
    // data = d3.sort(data, (d) => d["hours"]);

    //load map and initialise the views
    init();

    // data visualization
    visualization();
  });

/*----------------------
INITIALIZE VISUALIZATION
----------------------*/
function init() {

  let width = screen.width;
  let height = screen.height;

  //init selections
  selectedGameId = 23;
  prevChosenGameData = data.find(game => game.id === selectedGameId);
  chosenGameData = data.find(game => game.id === selectedGameId);
    
  //d3 canvases for svg elements
  buttonArea = d3.select("#button_div");
  barChartArea = d3.select("#barchart_div");
  detailArea = d3.select("#detail_div");
  
  /* detailArea = d3.select("#detail_div").append("svg")
    .attr("width", d3.select("#detail_div").node().clientWidth)
    .attr("height", d3.select("#detail_div").node().clientHeight); */


  //computation of top value in all the data
  topValue = 0
  for (let index = 0; index < data.length; index++) {
    if (topValue < data[index]["popularity"]) topValue = data[index]["popularity"]
  }
  console.log("Top overall value is " + topValue)

  //gap size for heatmap row labels
  labelWidth = (1 / 8) * detailArea.node().clientWidth;

  //width of one bar/column of the heatmap
  barWidth = ((7 / 8) * detailArea.node().clientWidth) / data.length;

  buttonArea.append("button")
    .attr("class", "button_normal")
    .attr("id", "NameB")
    //.style("transform", `scale(${1.5})`)
    //.style("transform-origin", "top left")
    .text("Name")
    .on("click", function () { buttonClick("name", "NameB"); });

  buttonArea.append("button")
    .attr("class", "button_normal")
    .attr("id", "PlaytimeB")
    //.style("transform", `scale(${1.5})`)
    //.style("transform-origin", "top left")
    .text("Playtime")
    .on("click", function () { buttonClick("hours", "PlaytimeB"); });

  buttonArea.append("button")
    .attr("class", "button_normal")
    .attr("id", "UserscoreB")
    //.style("transform", `scale(${1.5})`)
    //.style("transform-origin", "top left")
    .text("Userscore")
    .on("click", function () { buttonClick("userscore", "UserscoreB"); });

  buttonArea.append("button")
    .attr("class", "button_normal")
    .attr("id", "PopularityB")
    //.style("transform", `scale(${1.5})`)
    //.style("transform-origin", "top left")
    .text("Popularity")
    .on("click", function () { buttonClick("popularity", "PopularityB"); });
}


/*----------------------
BEGINNING OF VISUALIZATION
----------------------*/
function visualization() {

  //drawTextInfo();

  drawTable();

  drawDetailArea();

}


/*----------------------
BAR CHART
----------------------*/
function drawBarChart(region) {

  //clear all child nodes from barchart SVG canvas (all rects and texts)
  barChartArea.selectAll("*").remove()

  //get area width/height
  let thisCanvasHeight = barChartArea.node().clientHeight

  //interate over rows in the data
  /*
  for (let index = 0; index < data.length; index++) {

    //compute old bar height with respect to the represented value and availible space
    var previousBarHeight = (data[index][previousSelectedRegion] / topValue) * thisCanvasHeight

    //compute new bar height with respect to the represented value and availible space
    var barHeight = (data[index][region] / topValue) * thisCanvasHeight



    //append a bar to the barchart
    barChartArea.append('rect') 
      .attr("x", labelWidth + index * barWidth)//attributes before transition
      .attr("y", thisCanvasHeight - previousBarHeight)
      .attr("width", barWidth + 1)
      .attr("height", previousBarHeight)
      .attr("fill", "darkblue")
      .on("click", function () { chartClick(index); }) //registering the click event and folow up action
      .transition() //transition animation
        .duration(1000)
        .attr("y", thisCanvasHeight - barHeight)//attributes after transition
        .attr("height", barHeight)
  }

  //intialize year variable
  var year = ""

  //iterate over rows in the data
  for (let index = 0; index < data.length; index++) {

    //test for change of the year, if the year changes, append the text label to the barchart
    if (data[index].date.substr(0, 4) != year) {

      year = data[index].date.substr(0, 4)

      barChartArea.append("text")
        .attr("x", labelWidth + index * barWidth)
        .attr("y", thisCanvasHeight)
        .attr("class", "subline")
        .style('fill', 'white')
        .text(year)
    }
  }

  //append rectagle outlining the selected timepoint
  timeIndicatorBarchart = barChartArea.append('rect')
    .attr("x", labelWidth + selectedIndex*barWidth)
    .attr("y", 0)
    .attr("width", barWidth)
    .attr("height", thisCanvasHeight)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("opacity", 0.7)
    .style("stroke-width", 3)


  /*
  //Square transition example
  barChartArea.append('rect')
    .attr("x", thisCanvasWidth / 3) 
    .attr("y", thisCanvasHeight / 3) 
    .attr("width", 80) 
    .attr("height", 80) 
    .attr("fill", "red" )
    .transition()
      .duration(5000)
      .attr("x", 2 * thisCanvasWidth / 3)
      .attr("y", 2 * thisCanvasHeight / 3)
      .attr("width", 40)
      .attr("height", 40) 
      .attr("fill", "blue" );
  */

  

}

/*----------------------
TABLE
----------------------*/
function drawTable() {
  barChartArea.selectAll("*").remove();

  for (let index = 0; index < data.length; index++) {
    barChartArea.append("div")
        .style("margin-top", "1%")
        .style("margin-right", "1%")
        .attr("class", "button-54")
        //.style("transform", `scale(${1.2})`)
        //.style("transform-origin", "top left")
        //.style("width", `${100 / 1.29}%`)
        .text(shortenString(data[index].name, maxRowLength))
        .on("click", function () { gameClick(data[index]); });
  }
}

/*----------------------
DETAIL AREA
----------------------*/
function drawDetailArea() {

  detailArea.selectAll("*").remove();
  let game = data.find(game => game.id === selectedGameId);

  detailArea.append("div")
    .attr("class", "headline")
    .attr("font-size", 30)
    .style("margin-left", "1em")
    .style("fill", "white")
    .text(shortenString(game.name, maxHeadlineLength));

  let userscore = detailArea.append("div")
    .attr("class", "range")
    .style("margin-left", "2em")
    .style("margin-top", "3em")
    .style("--p", `${game.userscore}`);
  
  userscore.append("div")
    .attr("class", "range__label")
    .text("Userscore");
  
  detailArea.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "1.5em")
    .style("margin-top", "1em")
    .text("Playtime");

  detailArea.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "2em")
    .style("font-size", "15px")
    .text(`${game.hours}`)

  detailArea.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "1.5em")
    .style("margin-top", "1em")
    .text("Popularity");

  detailArea.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "2em")
    .style("font-size", "15px")
    .text(`${game.popularity}`);

    detailArea.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "1.5em")
    .style("margin-top", "1em")
    .text("Release date");

  detailArea.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "2em")
    .style("font-size", "15px")
    .text(`${game.release_date}`);

  detailArea.append("div")
    .attr("id", "barchart")
    .style("margin-left", "1em")
    .style("margin-top", "1em")
    .style("height", "20vh")
    .style("width", "100%")
    .style("float", "left");

    gameHours(barchart);
}

function gameHours(barchart) {
  // Sort the data by hours played
  var sortedData = data.slice().sort((a, b) => b.hours - a.hours);
  sortedData.map((x, i) => {x.index = i; return x});
  sortedData = sortedData.filter(x => x.hours > 20);
  console.log(sortedData);

  // Create a linear scale for the x-axis
  const xScale = d3.scaleLinear()
    .domain([0, sortedData.length - 1])
    .range([0, barchart.offsetWidth]);
  
  // Create a linear scale for the y-axis
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(sortedData, (d) => d.hours)])
    .range([barchart.offsetHeight, 0]);

  // Create an area generator
  const areaGenerator = d3.area()
    .x(d => xScale(d.index))
    .y0(yScale(0))
    .y1(d => yScale(d.hours));

  // Create a linear gradient for the area
  const color = d3.scaleLinear()
    .domain([0, d3.max(sortedData, (d) => d.hours)])
    .range(['black', 'yellow']);

  // Create a linear gradient for the highlighted game
  const highlightColor = d3.scaleLinear()
    .domain([0, d3.max(sortedData, (d) => d.hours)])
    .range(['red', 'orange']);

  // Create a path for the highlighted area
  const highlightArea = d3.area()
    .x(d => xScale(d.index))
    .y0(yScale(0))
    .y1(0);

  // Create the line object
  const line = d3.line()
    .x(d => xScale(d.index))
    .y(d => yScale(d.hours));

  // Wait for the SVG element to be created
  var svg = d3.select("#barchart").append("svg")
    .attr("width", barchart.offsetWidth)
    .attr("height", barchart.offsetHeight)

  // Create a linear gradient
  var gradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "areaGradient");
  
  // Assuming your color scale is defined as 'color'
  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", color(sortedData[0].hours));
  
  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", color(sortedData[sortedData.length - 1].hours));

  // Create a shaded area under the line for each game
  svg.append('path')
    .attr('class', 'area')
    .attr('d', areaGenerator(sortedData))
    .style('fill', 'url(#areaGradient)');

  var xAxis = svg.append('g')
    .attr('class', 'grid x-grid')
    .attr('id', 'xGrid');

  xAxis.append('line')
    .attr('x1', '0')
    .attr('x2', '0')
    .attr('y1', '0')
    .attr('y2', barchart.offsetHeight)
    .attr('stroke-width', '2')
    .attr('stroke', 'black');

  var maxHours = d3.max(sortedData, (d) => d.hours);

  for (let i = 0; i < 5; i++) 
  {
    svg.append('text')
      .attr('x', '')
      .attr('y', '')
  }


  // Create the highlighted area
  svg.append('path')
    .attr('class', 'highlight-area')
    .attr('d', highlightArea([prevChosenGameData]))
    .style('fill', d => highlightColor(prevChosenGameData.hours))
    .attr('stroke-width', '3')
    .attr('stroke', 'blue')
    .transition()
      .duration(1000)
      .attr('d', highlightArea([chosenGameData]))

  // Create the line chart
  var line_chart = svg.append('path')
    .attr('class', 'line')
    .attr('d', line(sortedData))
    .style('fill', '#767a83');

  var val = line_chart.attr("d");
  line_chart.attr("d", `${val}L${barchart.offsetWidth},0`)
}

/*----------------------
INTERACTION
----------------------*/
function mapClick(region) {
  console.log(region)

  //store previous and new selection
  previousSelectedRegion = selectedRegion
  selectedRegion = region;

  //set the text descrition
  selectedAreaText.text("Selected Region: " + selectedRegion.replace(/_/g, " "));

  //remove highlighted outline from previous region
  d3.select("#map").select("#" + previousSelectedRegion).style("stroke", "gray");

  //add highlighted outline to new selected region  
  d3.select("#map").select("#" + selectedRegion).style("stroke", "white");

  //move selected region to the top layer of the svg graphics (to avoid problems with overlapping contours)
  d3.select("#map").select("#" + selectedRegion).raise();

  //redraw barchart with newly selected region
  drawBarChart(selectedRegion);

}

function gameClick(game) {
  console.log(game.id)
  selectedGameId = game.id;
  prevChosenGameData = chosenGameData;
  chosenGameData = game;

  drawDetailArea();
}

function buttonClick(sortMethod, buttonId) {
  let button = d3.select(`#${buttonId}`);
  if (button.classed("button_clicked")) {
    button.classed("button_clicked", false);
    button.classed("button_normal", true);
    sortData("name");
  } 
  else {
    buttonArea.selectAll("div > *").classed("button_clicked", false);
    buttonArea.selectAll("div > *").classed("button_normal", true);
    button.classed("button_normal", false);
    button.classed("button_clicked", true);
    sortData(sortMethod);
  }
}

/*----------------------
HELP FUNCTIONS
----------------------*/
function shortenString(string, maxLength) {
  if (string.length > maxLength) {
      return string.substring(0, maxLength - 3) + '...';
  }
  return string;
}

function sortData(method) {
  data = data.sort((a, b) => d3.ascending(a.name.toLowerCase(), b.name.toLowerCase()));
  if (method !== "name") {
    data.sort((a, b) => d3.descending(a[method], b[method]));
  }
  drawTable();
}
