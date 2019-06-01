const VIDEOS_URL = "https://[your api gateway ID].execute-api.[region].amazonaws.com/dev/videos"
function getVideos(){
$.ajax({
  url: VIDEOS_URL+'?userid=1',
  headers: {          
	'x-api-key': '[api key]'   
  },
  success : function(data) {  
    var items = [];
	  $.each( data, function( key, video ) {
		items.push( "<li id='" + key + "'><div class='videourl' data='"+video.url+"'>" + video.title + "</div></li>" );
	  });
	 
	  $( "<ul/>", {
		"class": "freevideos-display",
		html: items.join( "" )
	  }).appendTo("#freevideos");
	  
	  $( "a.videourl" ).bind( "click", function() {
		  alert( "User clicked on 'foo.'" );
		});

		$( ".videourl" ).click(function() {
			try{
			var videourl = this.attributes.data.nodeValue;
			if (videourl != undefined){
				playVideo(videourl)
			}
			}catch(e){
				console.log(e)
			}	
		});

	}
});
}

function playVideo(videoUrl){
	$("#videocontainer").html("<video width='320' height='240' controls><source src='"+videoUrl+"' type='video/mp4'>Your browser does not support the video tag.</video>");
}