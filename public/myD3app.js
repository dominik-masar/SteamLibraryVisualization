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
var recordArea;
var detailArea;

//variables for selection
var selectedGameId = -1;
var chosenGameData;
var prevChosenGameData;

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
    
  //d3 canvases for svg elements
  buttonArea = d3.select("#button_div");
  recordArea = d3.select("#record_div");
  detailArea = d3.select("#detail_div");

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

  buttonArea.append("input")
    .attr("type", "file")
    .attr("class", "button_normal")
    .attr("id", "InputB")
    .style("float", "right")
    .on("change", handleFile);

  function handleFile() {
    var input = d3.select("#InputB").node();
    var file = input.files[0];

    if (file) {
      var reader = new FileReader();

      reader.onload = function (e) {
        // 'e.target.result' contains the content of the file
        var fileContent = e.target.result;

        // Remove the BOM if present (UTF-8 with BOM)
        if (fileContent.charCodeAt(0) === 0xFEFF) {
          fileContent = fileContent.slice(1);
        }
          
        // Parse the CSV content
        var tempData = d3.csvParse(fileContent);
        gameId = 0;

        data = tempData.map((obj) =>
          ({
            name: obj["game"],
            hours: +obj["hours"],
            userscore: +obj["userscore"],
            popularity: +obj["userscore_count"],
            release_date: obj["release_date"],
            id: gameId++,
          })
        );
      };

        // Read the file as text
        reader.readAsText(file);
    }
  }
}

function processData(d) {
  return {
    name: d["game"],
    hours: +d["hours"],
    userscore: +d["userscore"],
    popularity: +d["userscore_count"],
    release_date: d["release_date"],
    id: gameId++,
    //multiplayer: d["multiplayer any"],
  }
}

/*----------------------
BEGINNING OF VISUALIZATION
----------------------*/
function visualization() {
  drawTable();
}

/*----------------------
TABLE
----------------------*/
function drawTable() {
  recordArea.selectAll("*").remove();

  for (let index = 0; index < data.length; index++) {
    recordArea.append("div")
        .style("margin-top", "1%")
        .style("margin-right", "1%")
        .attr("class", "button-54")
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
    .attr("id", "barchart")
    .style("margin-left", "1em")
    .style("margin-top", "1em")
    .style("height", "20vh")
    .style("width", "100%")
    .style("float", "left");

  gameHours(barchart);

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
}

function gameHours(barchart) {
  // Sort the data by hours played
  var sortedData = data.slice().sort((a, b) => b.hours - a.hours);
  
  sortedData = sortedData.filter(x => x.hours > 5);
  //sortedData = sortedData.filter(x => x.hours < 50);
  sortedData.map((x, i) => {x.index = i; return x});
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

function gameClick(game) {
  console.log(game.id)
  selectedGameId = game.id;
  prevChosenGameData = (chosenGameData) ? chosenGameData : game;
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
