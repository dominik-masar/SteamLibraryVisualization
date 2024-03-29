//constants
const maxHeadlineLength = 30;
const maxRowLength = 25;

//variable containing reference to data
var data;

//D3.js canvases
var buttonArea;
var inputArea;
var recordArea;
var detailArea;

//slider variables
var gameSliderE;
var gameSliderW;
var popularitySliderW;
var popularitySliderE;

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
    data = csvData.filter(d => d.userscore);

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
  inputArea = d3.select("#input_div");
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

  drawButtonArea();
  drawInputArea();
}

function drawButtonArea() {
  var importDiv = buttonArea.append("div")
    .attr("class", "button_div")
    .attr("id", "importTip")
    .style("float", "left")
    .style("width", "auto")
    .style("position", "relative");

  importDiv.append("span")
    .text("Sort by: ");

  buttonArea.append("button")
    .attr("class", "button_normal")
    .attr("id", "NameB")
    .text("Name")
    .on("click", function () { buttonClick("name", "NameB"); });

  buttonArea.append("button")
    .attr("class", "button_normal")
    .attr("id", "PlaytimeB")
    .text("Playtime")
    .on("click", function () { buttonClick("hours", "PlaytimeB"); });

  buttonArea.append("button")
    .attr("class", "button_normal")
    .attr("id", "UserscoreB")
    .text("Userscore")
    .on("click", function () { buttonClick("userscore", "UserscoreB"); });

  buttonArea.append("button")
    .attr("class", "button_normal")
    .attr("id", "PopularityB")
    .text("Popularity")
    .on("click", function () { buttonClick("popularity", "PopularityB"); });
}

function drawInputArea() {
  var importDiv = inputArea.append("div")
    .attr("class", "button_div")
    .attr("id", "importTip")
    .style("float", "right")
    .style("width", "auto")
    .style("z-index", "1")
    .style("position", "relative");

  importDiv.append("span")
    .text("Export your data on ");

  importDiv.append("a")
    .attr("href", "https://www.lorenzostanco.com/lab/steam/")  // Replace with your desired URL
    .attr("target", "_blank")  // Open the link in a new tab
    .text("this web");

  importDiv.append("span")
    .text(" to CSV (use comma delimeter)");

  var fileInputContainer = inputArea.append("div")
    .style("box-shadow", "1px 1px 0px 0px, 2px 2px 0px 0px, 3px 3px 0px 0px, 4px 4px 0px 0px, 5px 5px 0px 0px")
    .style("border", "3px solid")
    .style("height", "32px")
    .style("width", "auto")
    .style("color", "black")
    .style("float", "right")
    .style("z-index", "2")
    .style("display", "inline-block")
    .style("clear", "right") // Add this line to clear the right side
    .style("position", "relative");

  // Add the file input to the container
  fileInputContainer.append("input")
    .attr("type", "file")
    .attr("class", "button_div")
    .attr("id", "InputB")
    .style("color", "transparent")
    .style("width", "7.1em")
    .style("margin", "0")  // Reset margin
    .style("padding", "0")  // Reset padding
    .on("change", handleFile);
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
  gameSliderE = d3.max(data, (d) => d.hours);
  gameSliderW = d3.min(data, (d) => d.hours);
  popularitySliderE = d3.max(data, (d) => d.popularity);
  popularitySliderW = d3.min(data, (d) => d.popularity);

  detailArea.selectAll("*").remove();
  let game = data.find(game => game.id === selectedGameId);

  // Headline
  detailArea.append("div")
    .attr("class", "headline")
    .attr("font-size", 30)
    .style("margin-left", "1em")
    .style("fill", "white")
    .text(shortenString(game.name, maxHeadlineLength));

  let userscore_release_cont = detailArea.append("div")
    .style("width", "100%")
    .style("height", "6em")
    .style("display", "flex")
    .style("justify-content", "center");

  var userscore_cont = userscore_release_cont.append("div")
    .style("width", "50%")
    .style("height", "6em");

  // Userscore Chart
  let userscore = userscore_cont.append("div")
    .attr("class", "range")
    .style("margin-left", "2em")
    .style("margin-top", "3em")
    .style("--p", `${game.userscore}`);
  
  userscore.append("div")
    .attr("class", "range__label")
    .text("Userscore");

  var release_cont = userscore_release_cont.append("div")
    .style("width", "50%")
    .style("height", "6em");

  // Release Date Label
  release_cont.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "1.5em")
    .style("margin-top", "1em")
    .text("Release date");

  release_cont.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "2em")
    .style("font-size", "15px")
    .text(`${game.release_date}`);
  
  // Game Hours Label
  detailArea.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "1.5em")
    .style("margin-top", "1em")
    .text("Playtime");

  detailArea.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "2em")
    .style("font-size", "15px")
    .text(`${formatNumber(game.hours.toFixed(2))} hours`)

  var hours_chart_container = detailArea.append("div")
    .style("height", "20vh")

  // hours axis
  var game_hour_axis = hours_chart_container.append("div")
    .attr("id", "game_hours_axis")
    .style("margin-top", "1em")
    .style("margin-bottom", "2em")
    .style("height", "20vh")
    .style("width", "10%")
    .style("float", "left")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("align-content", "space-between");

  // Game Hours Chart
  var gameChart = hours_chart_container.append("div")
    .attr("id", "game_hours_barchart")
    .style("margin-top", "1em")
    .style("margin-bottom", "2em")
    .style("height", "20vh")
    .style("width", "88%")
    .style("float", "left");

  gameHoursChart(game_hours_barchart);

  detailArea.append("div")
    .attr("id", "hours-slider-range")
    .style("margin-top", "2em")
    .style("margin-right", "auto")
    .style("margin-left", "auto")
    .style("height", "4vh")
    .style("width", "80%")
    .style("position", "relative")
    .style("float", "left");

  // Define the slider
  const hoursSliderRange = d3.sliderBottom()
    .min(gameSliderW)
    .max(gameSliderE)
    .width(detailArea.node().offsetWidth * 0.83)
    .tickFormat((d) => d.toFixed(0))
    .ticks(10)
    .default([gameSliderW, gameSliderE])
    .fill('yellow');


  hoursSliderRange.on('onchange', val => {
    gameSliderW = val[0];
    gameSliderE = val[1];

    gameChart.selectAll("*").remove();
    game_hour_axis.selectAll("*").remove();

    gameHoursChart(game_hours_barchart);
  });

  // Add the slider to the DOM
  const gRangeHours = d3.select('#hours-slider-range')
    .append('svg')
    .attr('width', detailArea.node().offsetWidth * 0.9)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(20,20)');

  gRangeHours.call(hoursSliderRange);

  // Popularity Label
  detailArea.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "1.5em")
    .style("margin-top", "1em")
    .text("Popularity");

  detailArea.append("div")
    .attr("class", "detail__label")
    .style("margin-left", "2em")
    .style("font-size", "15px")
    .text(`${formatNumber(game.popularity)} user reviews`);

  var popularity_chart_container = detailArea.append("div")
    .style("height", "20vh");

  // popularity axis
  var popularity_axis = popularity_chart_container.append("div")
    .attr("id", "popularity_axis")
    .style("margin-top", "1em")
    .style("margin-bottom", "2em")
    .style("height", "20vh")
    .style("width", "10%")
    .style("float", "left")
    .style("display", "flex")
    .style("flex-wrap", "wrap")
    .style("align-content", "space-between");

  // Popularity Chart
  var popularity_chart = popularity_chart_container.append("div")
    .attr("id", "popularity_barchart")
    .style("margin-top", "1em")
    .style("margin-bottom", "2em")
    .style("height", "20vh")
    .style("width", "88%")
    .style("float", "left");

  popularityChart(popularity_barchart);

  detailArea.append("div")
    .attr("id", "popularity-slider-range")
    .style("margin-top", "2em")
    .style("margin-right", "auto")
    .style("margin-left", "auto")
    .style("height", "4vh")
    .style("width", "80%")
    .style("position", "relative")
    .style("float", "left");

  // Define the slider
  const popularitySliderRange = d3.sliderBottom()
    .min(popularitySliderW)
    .max(popularitySliderE)
    .width(detailArea.node().offsetWidth * 0.83)
    .tickFormat((d) => d.toFixed(0))
    .ticks(10)
    .default([popularitySliderW, popularitySliderE])
    .fill('yellow');

  popularitySliderRange.on('onchange', val => {
    popularitySliderW = val[0];
    popularitySliderE = val[1];

    popularity_chart.selectAll("*").remove();
    popularity_axis.selectAll("*").remove();

    popularityChart(popularity_barchart);
  });

  // Add the slider to the DOM
  const gRangePopularity = d3.select('#popularity-slider-range')
    .append('svg')
    .attr('width', detailArea.node().offsetWidth * 0.9)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(20,20)');

  gRangePopularity.call(popularitySliderRange);
}

function gameHoursChart(barchart) {
  // Sort the data by hours played
  var sortedData = data.slice().sort((a, b) => b.hours - a.hours);
  
  sortedData = sortedData.filter(x => gameSliderW <= x.hours && x.hours <= gameSliderE);

  if (sortedData.length === 0) {
    var cont = d3.select("#game_hours_barchart").append("div")
      .style("width", "100%")
      .style("height", "100%")
      .style("display", "flex")
      .style("justify-content", "center")
      .style("align-items", "center")

    cont.append("div")
      .attr("class", "detail__label")
      .style("text-align", "center")
      .text("NO DATA!");

    return;
  }
  if (sortedData.length === 1) {
    sortedData.push({...sortedData[0]});
  }

  d3.select("#game_hours_axis").append("div")
    .attr("class", "detail__label")
    .style("width", "80%")
    .style("font-size", "15px")
    .style("margin-left", "1em")
    .style("text-align", "end")
    .text(formatNumber(d3.max(sortedData, (d) => d.hours).toFixed(2)));

  d3.select("#game_hours_axis").append("div")
    .attr("class", "detail__label")
    .style("width", "80%")
    .style("font-size", "15px")
    .style("margin-left", "1em")
    .style("text-align", "end")
    .text(formatNumber(d3.min(sortedData, (d) => d.hours).toFixed(2)));

  var highlight = true;
  if (!sortedData.some(obj => obj.name === chosenGameData.name)) {
    highlight = false;
  }

  var lastGame = prevChosenGameData;
  if (highlight && !sortedData.some(obj => obj.name === prevChosenGameData.name)) {
    lastGame = chosenGameData;
  }

  sortedData.map((x, i) => {x.index = i; return x});
  //console.log(sortedData);

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
  var svg = d3.select("#game_hours_barchart").append("svg")
    .attr("width", barchart.offsetWidth)
    .attr("height", barchart.offsetHeight)

  // Create a linear gradient
  var gradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "areaGradient");
  
  // Assuming your color scale is defined as 'color'
  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", 'yellow');
  
  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", 'black');

  // Create a shaded area under the line for each game
  svg.append('path')
    .attr('class', 'area')
    .attr('d', areaGenerator(sortedData))
    .style('fill', 'url(#areaGradient)');

  // Create the highlighted area
  if (highlight) {
    svg.append('path')
      .attr('class', 'highlight-area')
      .attr('d', highlightArea([lastGame]))
      .attr('stroke-width', '3')
      .attr('stroke', 'blue')
      .transition()
        .duration(1000)
        .attr('d', highlightArea([chosenGameData]))
  }
  
  // Create the line chart
  var line_chart = svg.append('path')
    .attr('class', 'line')
    .attr('d', line(sortedData))
    .style('fill', '#8A8A8A');

  var val = line_chart.attr("d");
  line_chart.attr("d", `${val}L${barchart.offsetWidth},0`)
}

function popularityChart(barchart) {
  // Sort the data by popularity
  var sortedData = data.slice().sort((a, b) => b.popularity - a.popularity);

  sortedData = sortedData.filter(x => popularitySliderW <= x.popularity && x.popularity <= popularitySliderE);

  if (sortedData.length === 0) {
    var cont = d3.select("#popularity_barchart").append("div")
      .style("width", "100%")
      .style("height", "100%")
      .style("display", "flex")
      .style("justify-content", "center")
      .style("align-items", "center")

    cont.append("div")
      .attr("class", "detail__label")
      .style("text-align", "center")
      .text("NO DATA!");

    return;
  }
  if (sortedData.length === 1) {
    sortedData.push({...sortedData[0]});
  }

  d3.select("#popularity_axis").append("div")
    .attr("class", "detail__label")
    .style("width", "80%")
    .style("font-size", "12px")
    .style("margin-left", "1em")
    .style("text-align", "end")
    .text(formatNumber(d3.max(sortedData, (d) => d.popularity)));

  d3.select("#popularity_axis").append("div")
    .attr("class", "detail__label")
    .style("width", "80%")
    .style("font-size", "12px")
    .style("margin-left", "1em")
    .style("text-align", "end")
    .text(formatNumber(d3.min(sortedData, (d) => d.popularity)));

  var highlight = true;
  if (!sortedData.some(obj => obj.name === chosenGameData.name)) {
    highlight = false;
  }

  var lastGame = prevChosenGameData;
  if (highlight && !sortedData.some(obj => obj.name === prevChosenGameData.name)) {
    lastGame = chosenGameData;
  }

  sortedData.map((x, i) => {x.index = i; return x});
  //console.log(sortedData);

  // Create a linear scale for the x-axis
  const xScale = d3.scaleLinear()
    .domain([0, sortedData.length - 1])
    .range([0, barchart.offsetWidth]);
  
  // Create a linear scale for the y-axis
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(sortedData, (d) => d.popularity)])
    .range([barchart.offsetHeight, 0]);

  // Create an area generator
  const areaGenerator = d3.area()
    .x(d => xScale(d.index))
    .y0(yScale(0))
    .y1(d => yScale(d.popularity));

  // Create a path for the highlighted area
  const highlightArea = d3.area()
    .x(d => xScale(d.index))
    .y0(yScale(0))
    .y1(0);

  // Create the line object
  const line = d3.line()
    .x(d => xScale(d.index))
    .y(d => yScale(d.popularity));

  // Wait for the SVG element to be created
  var svg = d3.select("#popularity_barchart").append("svg")
    .attr("width", barchart.offsetWidth)
    .attr("height", barchart.offsetHeight)

  // Create a linear gradient
  var gradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "areaGradient");
  
  // Assuming your color scale is defined as 'color'
  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", 'yellow');
  
  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", 'black');

  // Create a shaded area under the line for each game
  svg.append('path')
    .attr('class', 'area')
    .attr('d', areaGenerator(sortedData))
    .style('fill', 'url(#areaGradient)');

  // Create the highlighted area
  if (highlight) {
    svg.append('path')
      .attr('class', 'highlight-area')
      .attr('d', highlightArea([lastGame]))
      .attr('stroke-width', '3')
      .attr('stroke', 'blue')
      .transition()
        .duration(1000)
        .attr('d', highlightArea([chosenGameData]))
  }
  
  // Create the line chart
  var line_chart = svg.append('path')
    .attr('class', 'line')
    .attr('d', line(sortedData))
    .style('fill', '#8A8A8A');

  var val = line_chart.attr("d");
  line_chart.attr("d", `${val}L${barchart.offsetWidth},0`)
}

function gameClick(game) {
  //console.log(game.id)
  selectedGameId = game.id;
  prevChosenGameData = (chosenGameData) ? chosenGameData : game;
  chosenGameData = game;

  drawDetailArea();
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

function buttonClick(sortMethod, buttonId) {
  let button = d3.select(`#${buttonId}`);
  if (button.classed("button_clicked")) {
    resetButtons();
  } 
  else {
    resetButtons();
    button.classed("button_normal", false);
    button.classed("button_clicked", true);
    sortData(sortMethod);
  }
}

function resetButtons() {
  buttonArea.selectAll("div > button").classed("button_clicked", false);
  buttonArea.selectAll("div > button").classed("button_normal", true);
  sortData("name");
}

function formatNumber(input) {
  const numberStr = String(input);

  const parts = numberStr.split('.');
  const integerPart = parts[0] ? parts[0] : '0';
  const decimalPart = parts[1] ? `.${parts[1]}` : '';

  const reversedInteger = integerPart.split('').reverse().join('');
  const spacedInteger = reversedInteger.match(/.{1,3}/g).join(' ');
  const formattedInteger = spacedInteger.split('').reverse().join('');

  const result = `${formattedInteger}${decimalPart}`;

  return result;
}

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

      detailArea.selectAll("*").remove();
      resetButtons();
      visualization();
    };

      // Read the file as text
      reader.readAsText(file);
  }
}
