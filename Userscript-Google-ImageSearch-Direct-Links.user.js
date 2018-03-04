// ==UserScript==
// @name		Google Image Search Direct Links Old Style
// @version		1.1
// @description Replace links and click actions of the Google Image Search results with direct links to the picture, and the page link. Now opens in the same tab by default
// @downloadURL	https://github.com/svArtist/blargh.user.js
// @namespace	bp
// @author		Benjamin Philipp <benjamin_philipp [at - please don't spam] gmx.de>
// @include		/^https?:\/\/(www\.)*google\.[a-z\.]{2,5}\/search.*tbm=isch.*/
// @require 	http://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js
// @run-at		document-body
// @grant		GM_xmlhttpRequest
// @connect		*
// ==/UserScript==

var maxtries = 10;

var idle = true;
var disableUpdate = false;

function updatePage()
{
	if($("#directLinkStyles").length<=0){
		disableUpdate = true;
		$("head").append("\
		<style id='directLinkStyles'>\
		.linkswait{ \
			box-shadow: 0 0 20px #f00; \
			border: 2px solid #f00; \
			border-radius: 5px; \
		</style>");
		disableUpdate = false;
	}

	$(".rg_di.rg_bx a.rg_l:not(.linksdone):not([href='#'])").each(function(){
		var tp = this;
		var uriLink = $(this).parent().find("div.rg_ilmbg")[0];
		var imin = tp.href.indexOf("imgurl=");
		if(imin<0)
		{
            $(tp).attr("resTries", $(tp).attr("resTries")?$(tp).attr("resTries")*1+1:1);
            if($(tp).attr("resTries")*1>=maxtries){
                console.log("This Link won't come up with a good fragment: " + $(tp).find("img")[0].src);
                return true;
            }
			updater();
			return true;
		}
		var linkconts = tp.href.substr(imin+7);
		var piclink = linkconts.substr(0,linkconts.indexOf("&"));
		var reflink = linkconts.substr(linkconts.indexOf("imgrefurl=")+10);
		reflink = decodeURIComponent(reflink.substr(0, reflink.indexOf("&")));
		piclink = decodeURIComponent(piclink);
		disableUpdate = true;
		tp.href = piclink;
		
		$(tp).off("click");
		$(uriLink).off("click");
		
		$(tp).click(function(e){
			e.stopImmediatePropagation(); // prevent event from bubbling up to google's handler
//			window.open(this.href); // not needed, doing it old school
//			return false;
		})
		uriLink.innerHTML = "<a style='display:block; color:#fff; text-decoration:none;' href = '" + reflink + "'>" + uriLink.innerHTML + "</a>"; // Replace <span> text content with an actual link
		$(uriLink).click(function(e){
//			e.preventDefault();
			e.stopImmediatePropagation();
//			window.open(reflink); // not needed, doing it old school
//			return false;
		})
        $(this).removeClass("linkswait");
		$(this).addClass("linksdone");
		disableUpdate = false;
	});
    var notready = false;
    $(".rg_di.rg_bx a.rg_l[href='#']:not(.linksdone)").each(function(){
        notready = true;
        if(!$(this).hasClass("linkswait")){
            $(this).addClass("linkswait");
        }
    });
	if(notready){
		updater();
	}
}

function updater(t = 1000){
	if(idle)
	{
		idle = false;
		updaterequest = false;
		updatePage();
		idletimer = setTimeout(function(){
			idle = true;
			if(updaterequest)
				updatePage();
		}, t);
	}
	else
	{
		updaterequest = true;
	}
}

var bodyObserver = false;
function observeResults(){
	// console.log("observing");
	resultsObserver = new MutationObserver(updater);
	resultsObserver.observe($("#ires #rg")[0], {subtree: true, childList: true});
	if(bodyObserver !== false)
		bodyObserver.disconnect();
}


if($("#ires #rg").length>0){
	observeResults();
}
else{
	bodyObserver = new MutationObserver(function(mutations){
		if(disableUpdate || !idle){
			return;
		}
		if($("#ires #rg").length>0)
		{
			observeResults();
		}
	});
	bodyObserver.observe($("body")[0], {subtree: true, childList: true});
}

updatePage();
