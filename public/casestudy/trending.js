var w;
var max = 50;
var svg = d3.select("#bubbles").append("svg");

    function makeTooltip(d){
        return "<strong>Keyword:</strong> <span style='color:steelblue'>" 
           + d.className + "</span></br>" +
          "<strong>Color Group:</strong> <span style='color:steelblue'>" 
           + d.packageName + "</span></br>" +
          "<strong>Score:</strong> <span style='color:steelblue'>" 
           + numeral(d.value).format('0.00') + "</span></br>"
          }
    var tip = d3.tip()
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(function (d) { return makeTooltip(d);});
    svg.call(tip);  

var filterToggle = {
  'source_site': {
    'Mention': true,
    'Facebook': true,
    'Instagram': true,
    'Twitter': true },
  'context': {
    'Comment': true,
    'Mention': true,
    'Search': true },
  'search_term': { 
    'Tea': true,
    'Cocktail': true}
};

queue()
    .defer(d3.json, '/keywords') //, function(d) { rateById.set(d.id, +d.rate); })
    .await(ready);

function ready(err, words){

  // WORD CLOUD ///////////////////
      var fill = d3.scale.category20();

      function initWordcloud(words){

          var cloud = d3.layout.cloud()
            cloud
            .size([500, 600])
            .words(words)
              .padding(5)
              .rotate(function() { return ~~(Math.random() * 2) * 90; })
              .font("Impact")
              .fontSize(function(d) { return d.size; })
              .on("end", draw)
              .start();        
      }

      function draw(words) {

        d3.select("#wordcloud").append("svg")
            .attr('class','wordcloud')
            .attr("width", 1200)
            .attr("height", 1200)
          .append("g")
            .attr("class", "words")
            .attr("transform", "translate(150,150)")
          .selectAll("text")
            .data(words)
          .enter().append("text")
            .attr('class','wordtext')
            .attr('opacity', .25)      
            .transition()
            .duration(1000)
            .attr('opacity', 1)
            .style("font-size", function(d) { return d.size + "px"; })
            .style("font-family", "Impact")
            .style("fill", function(d, i) { return fill(i); })
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; });
      }
      function reloadWordcloud(newords){


          var updateBars = d3.selectAll('g.words');

          var newData = updateBars.selectAll("text")
              .data(newords);

          newData.exit().remove();

          updateBars.selectAll("text") // UPDATES DATA ON EXISTING BARS
                  .attr('class','wordtext')
                  .attr('opacity', .25)      
                  .transition()
                  .duration(1000)
                  .attr('opacity', 1)
                  .style("font-size", function(d) { return d.size + "px"; })
                  .style("font-family", "Impact")
                  .style("fill", function(d, i) { return fill(i); })
                  .attr("text-anchor", "middle")
                  .attr("transform", function(d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                  })
                  .text(function(d) { return d.text; });


      }


  // USE ONLY COMMENT DATA WITH NO SEARCH TERM
  var initData = [];
  for (c in words){
    if( words[c].context == 'Comment' && words[c].search_term == null){     
      initData.push({ text: words[c].word, size: (words[c].score) });
    }
  }

  initWordcloud(initData);
  // reloadWordcloud(newords);
  // END WORD CLOUD



function updateCloudData(filter){

w = words;

  var c = [];
  for(word in words){
    if( words[word].context == 'Comment' && words[word].search_term == null && (filter == 'all' || words[word].source_site == filter)){
      c.push({ text: words[word].word, size: words[word].score});
    }
  }
  return c;

}

// BUBBLES ///////////////////////////////////////
// w = words;
// var c = [];
// for(word in words){
//   if(words[word].score < 1){
//     c.push({ name: words[word].word, size: Math.pow(words[word].score,2) });
//   }
// }

// function compare(a,b) {
//   if (a.size < b.size)
//      return -1;
//   if (a.size > b.size)
//     return 1;
//   return 0;
// }

// c.sort(compare);
// c = c.slice(0,max);

// var bubbles = { name: 'bubbles', children: c };
var bubbles = refilterBubble();

var diameter = 500,
    format = d3.format(",d"),
    color = d3.scale.ordinal().domain(['Mention','Twitter','Facebook','Instagram'])
          .range(colorbrewer['BrBG'][4]);

var bubble = d3.layout.pack()
    .sort(null)
    .size([diameter, diameter])
    .padding(1.5);

svg
    .attr("width", diameter)
    .attr("height", diameter)
    .attr("class", "bubble");

var node = svg.selectAll(".node")
    .data(bubble.nodes(classes(bubbles))
    .filter(function(d) { return !d.children; }))
  .enter().append("g")
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    .attr("class", "node")
    .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

node.append("circle")
    .attr('opacity',0)
    .attr("r", 0)
    .transition()
    .duration(1000)
    .attr('opacity',1)
    .attr("r", function(d) { return d.r; })
    .style("fill", function(d) { return color(d.packageName); });

node.append("text")
    .attr('dy', 0)
    .transition()
    .attr("dy", ".3em")
    .style("text-anchor", "middle")
    .text(function(d) { return d.className.substring(0, d.r / 3); });

// Returns a flattened hierarchy containing all leaf nodes under the root.
function classes(bubbles) {
  var classes = [];

  function recurse(name, node) {
    if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
    else classes.push({packageName: name, className: node.name, value: node.size});
  }

  recurse(null, bubbles);
  return {children: classes};
}
d3.select(self.frameElement).style("height", diameter + "px");


function filterBubsData(tempWords){
  // var tempWords = words;
  function compare(a,b) {
    if (a.score < b.score)
       return -1;
    if (a.score > b.score)
      return 1;
    return 0;
  }

// SCORE < 1
var tempWords = tempWords.filter(function(obj) {
    return (obj.score < 1);
});   

if (filterToggle.source_site.Mention == false) {
  var tempWords = tempWords.filter(function(obj) {
      return (obj.source_site !== 'Mention');
  });   
}
if (filterToggle.source_site.Facebook == false) {
  var tempWords = tempWords.filter(function(obj) {
      return (obj.source_site !== 'Facebook');
  });   
}
if (filterToggle.source_site.Instagram == false) {
  var tempWords = tempWords.filter(function(obj) {
      return (obj.source_site !== 'Instagram');
  });   
}
if (filterToggle.source_site.Twitter == false) {
  var tempWords = tempWords.filter(function(obj) {
      return (obj.source_site !== 'Twitter');
  });   
}
if (filterToggle.context.Comment == false) {
  var tempWords = tempWords.filter(function(obj) {
      return (obj.context !== 'Comment');
  });   
}
if (filterToggle.context.Mention == false) {
  var tempWords = tempWords.filter(function(obj) {
      return (obj.context !== 'Mention');
  });   
}
if (filterToggle.context.Search == false) {
  var tempWords = tempWords.filter(function(obj) {
      return (obj.context !== 'Search');
  });   
}
if (filterToggle.search_term.Tea == false) {
  var tempWords = tempWords.filter(function(obj) {
      return (obj.search_term !== 'Tea');
  });   
}
if (filterToggle.search_term.Cocktail == false) {
  var tempWords = tempWords.filter(function(obj) {
      return (obj.search_term !== 'Cocktail');
  });   
} 

 
  return tempWords.sort(compare).slice(0,max);


}

function refilterBubble(){

  wordsFiltered = filterBubsData(words);
  
  var newBubble = {name: 'bubbles', children: [
  {name: 'Comment', children: [
        { name: 'Tea', 
        children: [
            { name: 'Twitter', children: [] }, 
            { name: 'Instagram', children: [] }, 
            { name: 'Facebook', children: [] }, 
            { name: 'Mention', children: [] }
            ] },
        { name: 'Cocktail', 
        children: [
            {name: 'Twitter', children: [] }, 
            {name: 'Instagram', children: [] }, 
            {name: 'Facebook', children: [] }, 
            {name: 'Mention', children: [] }
        ] }
        ]},
  {name: 'Mention', children: [
        { name: 'Tea', 
        children: [
            { name: 'Twitter', children: [] }, 
            { name: 'Instagram', children: [] }, 
            { name: 'Facebook', children: [] }, 
            { name: 'Mention', children: [] }
            ] },
        { name: 'Cocktail', 
        children: [
            {name: 'Twitter', children: [] }, 
            {name: 'Instagram', children: [] }, 
            {name: 'Facebook', children: [] }, 
            {name: 'Mention', children: [] }
        ] }
        ]},
  {name: 'Search', children: [
        { name: 'Tea', 
        children: [
            { name: 'Twitter', children: [] }, 
            { name: 'Instagram', children: [] }, 
            { name: 'Facebook', children: [] }, 
            { name: 'Mention', children: [] }
            ] },
        { name: 'Cocktail', 
        children: [
            {name: 'Twitter', children: [] }, 
            {name: 'Instagram', children: [] }, 
            {name: 'Facebook', children: [] }, 
            {name: 'Mention', children: [] }
        ] }
        ]}
      ]};

  for (wd in wordsFiltered){
    var currAttributes = [wordsFiltered[wd].context, wordsFiltered[wd].search_term, wordsFiltered[wd].source_site];
    for (i in newBubble.children){
      if(currAttributes[0] == newBubble.children[i].name){
        for (j in newBubble.children[i].children) {
          if(currAttributes[1] == newBubble.children[i].children[j].name){
            for (k in newBubble.children[i].children[j].children) {
              if(currAttributes[2] == newBubble.children[i].children[j].children[k].name){
                newBubble.children[i].children[j].children[k].children
                    .push({ name: wordsFiltered[wd].word, size: Math.pow(wordsFiltered[wd].score,2) })
              }
            }
          }
        }
      }
    }
  }
  return newBubble;
}

function redrawBubbles(dataBub){


  svg.selectAll("g.node").data([]).exit().remove();

  var nodes = svg.selectAll("g.node")
      .data(bubble.nodes(classes(dataBub))
      .filter(function(d) { return !d.children; }));

  var newNodes = nodes.enter().append('g')
      .attr('opacity', 1)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .attr('class','node')
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

  nodes.selectAll(".node")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      ;

  nodes.append("circle")
      .attr("r", 0)
      .transition()
      .duration(1000)
      .attr("r", function(d) { return d.r; })
      .style("fill", function(d) { return color(d.packageName); });

  nodes.append("text")
      .attr('opacity', 0)
      .attr('dy', 0)
      .transition()
      .duration(1000)
      .attr('opacity', 1)
      .attr("dy", ".3em")
      .style("text-anchor", "middle")
      .text(function(d) { return d.className.substring(0, d.r / 3); });

  nodes.exit().remove();
}

// //////////////////////////////////////////


var allCloud = true, instaCloud = false, fbCloud = false;

d3.select('#allCloud').on('click', function(){ 
  if(allCloud !== true){
    allCloud = true, fbCloud = false, instaCloud = false;
    $('#allCloud').attr('class','btn btn bg-green-haze active');
    $('#instaCloud').attr('class','btn btn-default');
    $('#fbCloud').attr('class','btn btn-default');
    var temp = updateCloudData('all');
    var tempcloud = d3.layout.cloud()
              tempcloud
              .size([300, 300])
              .words(temp)
                .padding(5)
                .rotate(function() { return ~~(Math.random() * 2) * 90; })
                .font("Impact")
                .fontSize(function(d) { return d.size; })
                .start();
    reloadWordcloud(temp);   
}
});

d3.select('#instaCloud').on('click', function(){ 
  if(instaCloud !== true){
      instaCloud = true, allCloud = false, fbCloud = false;
    $('#instaCloud').attr('class','btn btn bg-green-haze active');
    $('#allCloud').attr('class','btn btn-default');
    $('#fbCloud').attr('class','btn btn-default');
    var temp = updateCloudData('Instagram');
    var tempcloud = d3.layout.cloud()
              tempcloud
              .size([300, 300])
              .words(temp)
                .padding(5)
                .rotate(function() { return ~~(Math.random() * 2) * 90; })
                .font("Impact")
                .fontSize(function(d) { return d.size; })
                .start();
    reloadWordcloud(temp);   
  }  
});
d3.select('#fbCloud').on('click', function(){ 
  if(fbCloud !== true){
    fbCloud = true, instaCloud = false, allCloud = false;
    $('#fbCloud').attr('class','btn btn bg-green-haze active');
    $('#instaCloud').attr('class','btn btn-default');
    $('#allCloud').attr('class','btn btn-default');
    var temp = updateCloudData('Facebook');
    var tempcloud = d3.layout.cloud()
              tempcloud
              .size([300, 300])
              .words(temp)
                .padding(5)
                .rotate(function() { return ~~(Math.random() * 2) * 90; })
                .font("Impact")
                .fontSize(function(d) { return d.size; })
                .start();
    reloadWordcloud(temp);   
  }
});


d3.select('#twitter').on('click', function(){
  if(filterToggle.source_site.Twitter == false){
    filterToggle.source_site.Twitter = true;
    d3.select('#twitter').attr('class','btn bg-green-haze active')
  } else {
    filterToggle.source_site.Twitter = false;
    d3.select('#twitter').attr('class','btn btn-default')
  }
  redrawBubbles(refilterBubble());
});
d3.select('#facebook').on('click', function(){
  if(filterToggle.source_site.Facebook == false) {
    filterToggle.source_site.Facebook = true;
    d3.select('#facebook').attr('class','btn bg-green-haze active')
  } else {
    filterToggle.source_site.Facebook = false;
    d3.select('#facebook').attr('class','btn btn-default')
  }
  redrawBubbles(refilterBubble());
});
d3.select('#instagram').on('click', function(){
  if(filterToggle.source_site.Instagram == false) {
    filterToggle.source_site.Instagram = true;
    d3.select('#instagram').attr('class','btn bg-green-haze active')
  } else {
    filterToggle.source_site.Instagram = false;
    d3.select('#instagram').attr('class','btn btn-default')
  }
  redrawBubbles(refilterBubble());
});
d3.select('#mention').on('click', function(){
  if(filterToggle.source_site.Mention == false) {
    filterToggle.source_site.Mention = true;
    d3.select('#mention').attr('class','btn bg-green-haze active')
  } else {
    filterToggle.source_site.Mention = false;
    d3.select('#mention').attr('class','btn btn-default')  
  }
  redrawBubbles(refilterBubble());
});
d3.select('#mentions').on('click', function(){
  if(filterToggle.context.Mention == false) {
    filterToggle.context.Mention = true;
    d3.select('#mentions').attr('class','btn bg-green-haze active')
  } else {
    filterToggle.context.Mention = false;
    d3.select('#mentions').attr('class','btn btn-default')  
  }
  redrawBubbles(refilterBubble());
});
d3.select('#comments').on('click', function(){
  if(filterToggle.context.Comment == false) {
    filterToggle.context.Comment = true;
    d3.select('#comments').attr('class','btn bg-green-haze active')
  } else {
    filterToggle.context.Comment = false;
    d3.select('#comments').attr('class','btn btn-default')
  }
  redrawBubbles(refilterBubble());
});
d3.select('#search').on('click', function(){
  if(filterToggle.context.Search == false) {
    filterToggle.context.Search = true;
    d3.select('#search').attr('class','btn bg-green-haze active')
  } else {
    filterToggle.context.Search = false;
    d3.select('#search').attr('class','btn btn-default')
  }
  redrawBubbles(refilterBubble());
});
d3.select('#tea').on('click', function(){
  if(filterToggle.search_term.Tea == false) {
    filterToggle.search_term.Tea = true;
    d3.select('#tea').attr('class','btn bg-green-haze active')
  } else {
    filterToggle.search_term.Tea = false;
    d3.select('#tea').attr('class','btn btn-default')    
  }
  redrawBubbles(refilterBubble());
});
d3.select('#cocktail').on('click', function(){
 if(filterToggle.search_term.Cocktail == false) {
    filterToggle.search_term.Cocktail = true;
    d3.select('#cocktail').attr('class','btn bg-green-haze active')
  } else {
    filterToggle.search_term.Cocktail = false;
    d3.select('#cocktail').attr('class','btn btn-default')
  }
  redrawBubbles(refilterBubble());
});

d3.select('#x200').on('click', function(){
  if(max !== 200){
      d3.select('#x200').attr('class','btn bg-green-haze active')    
      d3.select('#x100').attr('class','btn btn-default')    
      d3.select('#x50').attr('class','btn btn-default')    
      d3.select('#x25').attr('class','btn btn-default')    
      max = 200;
      redrawBubbles(refilterBubble());
  }
});
d3.select('#x100').on('click', function(){
  if(max !== 100){
      d3.select('#x100').attr('class','btn bg-green-haze active')    
      d3.select('#x200').attr('class','btn btn-default')    
      d3.select('#x50').attr('class','btn btn-default')    
      d3.select('#x25').attr('class','btn btn-default')    
      max = 100;
      redrawBubbles(refilterBubble());
}});
d3.select('#x50').on('click', function(){
  if(max !== 50){
      d3.select('#x50').attr('class','btn bg-green-haze active')    
      d3.select('#x200').attr('class','btn btn-default')    
      d3.select('#x100').attr('class','btn btn-default')    
      d3.select('#x25').attr('class','btn btn-default')    
      max = 50;
      redrawBubbles(refilterBubble());
}});
d3.select('#x25').on('click', function(){
  if(max !== 25){
      d3.select('#x25').attr('class','btn bg-green-haze active')    
      d3.select('#x100').attr('class','btn btn-default')    
      d3.select('#x50').attr('class','btn btn-default')    
      d3.select('#x200').attr('class','btn btn-default')    
      max = 25;
      redrawBubbles(refilterBubble());
}});





}


