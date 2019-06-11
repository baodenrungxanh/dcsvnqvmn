function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function extractThumbnail(content) {
    var thumbnail = "";

    var findUrl = false;
    for (var i = 0; i < 500; i++) {
        if (!findUrl) {
            if (content[i] == "'") {
                findUrl = true;
            }

        } else {

            if (content[i] == "'" && findUrl) {
                break;
            }

            thumbnail += content[i];
        }
    }

    return thumbnail;
}

//Load more trang danh sách
displayNumber = 8;
loadTimes = 0
postMaxPublished = "";

readDetaiTimes = 0;
// #region Xem chi tiết bài viết

isDetailAjaxPage = false; // Xác định đang mở xem chi tiết = ajax
currentState = "index";

// #region Chia sẽ vào mạng xã hội
function getMetaContent(e) {
    for (var t = document.getElementsByTagName("meta"), n = 0; n < t.length; n++)if (t[n].getAttribute("property") === e) return t[n].getAttribute("content"); return "";
}

$(document).on("click touch", ".fb-share, .zalo-share", function () {

    var e = getMetaContent("og:title"),
        n = getMetaContent("og:description"),
        i = getMetaContent("og:url");


    var r = $(this).attr("data-type"), o = $(this).attr("data-href");
    var title = getMetaContent("og:title");

    switch (window.ga && window.ga("send", {
        hitType: "event",
        eventCategory: "mobile_" + r,
        eventAction: "share",
        eventLabel: getMetaContent("og:title")
    }), r) {
        case "facebook":
            if ("undefined" !== window.FB) {
                var a = window.FB;

                a.ui({
                    method: "share",
                    href: o
                }, function (e) { })
            }
            break;
        default:
    }
})
// #endregion
blurDate = new Date();




//Load more trang danh sách
function listLoadMore() {
    allowLoadMore = true;

    // Bài viết ở dạng Page thì không load more
    if (location.href.indexOf('/p/') >= 0) {
        allowLoadMore = false;
    }

    $(window).scroll(function () {
        if ($(window).scrollTop() + $(window).height() > $(document).height() - 1500 && allowLoadMore) {
            requestLoadMore();
        }
    });
}

var loadTimes = 0;

function requestLoadMore() {
    allowLoadMore = false;

    // Kiểm tra còn bài viết hot không. nếu còn thì load bài viết hot chứ không load more
    if (remainingHot > 0) {
        suggestHotArticle();
        return;
    }

    // Bài viết ở dạng Page thì không load more
    if (location.href.indexOf('/p/') >= 0) {
        return;
    }

    $("#loader").css('display', 'inline-block');

    var nextLink = ($("#next-button").attr('href') + "&m=1");

    $.get(nextLink, function (response) {
        var responseDOM = $(response);

        // Kiểm tra có bài viết hot nào trùng với bài HOT đã được suggest hay chưa
        $.each(responseDOM.find("#post-list article"), function (index, item) {
            var itemId = item.getAttribute('id').replace('id-', '');

            // Nếu danh sách bài viết HOT đã suggest có chứa id của bài viết load-more thì không hiển thị
            if (displayedHotIdList.indexOf(itemId) >= 0) {
                item.remove();
            }
        });

        $("#post-list").append(responseDOM.find("#post-list").html());
        nextPage = responseDOM.find("#next-button").attr('href');
        $("#next-button").attr('href', nextPage);

        $("#loader").css('display', 'none');

        allowLoadMore = true;

        $("video:not([parsed='true'])").each(function () {
            this.onloadedmetadata = function (e) {
                assignVideoHandler(this);
            }
        });


        eval(responseDOM.find("#ids").html());
        getArticleStatistics();

        loadTimes++;

        ga('send', 'event', 'Timelines', 'Load more', loadTimes);
    });
}


function assignVideoHandler(element) {
    $(element).attr('parsed', true);
    $(element).attr('loop', true);
    $(element).attr('playsinline', 'playsinline');

   var height = $(element).height();


    $(element).onScreen({
        tolerance: height /2,
        toggleClass: false,
        doIn: function () {
            
        },
        doOut: function () {
            this.pause();
        }
    }); 
}

function toggleSearchBar() {
    var x = document.getElementById("search-bar");
    if (x.style.display === "none" || x.style.display == "") {
        x.style.display = "block";

        document.getElementById("search-box").focus();
    } else {
        x.style.display = "none";
    }
}

function closeShareMenu() {
    previousState = "";
    $('#share-action-menu').removeClass('visible');
}

function openShareMenu(url) {
    previousState = 'share-dialog';
    history.pushState({ event: 'share-dialog', url: url }, null, "#share");

    $("#share-action-menu").addClass('visible');
    $("#facebook-share-anchor").attr('href', url);
    $("#direct-link-anchor").attr('href', url);
}

function openCommentDialog(url, id) {
    $("#close-popup").show();

    previousState = "view-comment";
    history.pushState({ event: 'view-comment', url: url }, null, url + "#comment");
    console.log(url);
    if (typeof commentDialog == 'undefined') {
        commentDialog = $("<div class='modal comments-dialog' tabindex='-1' role='dialog'> <div class='modal-dialog' role='document'> <div class='modal-content'> <div class='modal-header'>  <a href='javascript:history.go(-1)' class='back-button pull-right'><i class='spr-close'></i></a> </div> <div class='modal-body'> <p>One fine body&hellip;</p> </div> </div> </div> </div>");
        $("body").append(commentDialog);
    }

    $(commentDialog).find("div[class='modal-body']").html("<div id='ajax-fb-comment' ><div class='fb-comments' data-order-by='social' data-href='" + url + "' data-numposts='7'></div></div>");

    commentDialog.modal('show');
    FB.XFBML.parse(document.getElementById("ajax-fb-comment"));


    if ($("video[playing='true']").length > 0)
        $("video[playing='true']")[0].pause();

    $.get('/feeds/posts/default/' + id + '?alt=json-in-script&callback=displayBuildinComment');
}

function displayBuildinComment(data) {
    var id = data.entry.id.$t;
    id = id.split('-', id.lastIndexOf('-') + 1)[2];

    var content = data.entry.content.$t;

    var commentSlip = content.split("comments = ");
    if (commentSlip.length >= 2) {
        var thisComments = commentSlip[1];
        thisComments = thisComments.replace("</script>", "");

        thisComments = JSON.parse(thisComments);

        var commentHtml = "";
        for (var i = 0; i < thisComments.length; i++) {

            var avatarSplit = thisComments[i].avatar.split('/');
            var userid = avatarSplit[3];


            commentHtml += "<div class='media'><div class='mr-2'><img src='" + thisComments[i].avatar + "'/></div><div class='media-body'><a href='https://www.facebook.com/" + userid + "' class='name' target='_blank'>" + thisComments[i].name + "</a><div class='message'>" + thisComments[i].message + "</div></div></div>";
        }

        commentHtml = "<div class='top-comments'>" + commentHtml + "</div>";
        $("#ajax-fb-comment").append(commentHtml);
    }
}

function getArticleStatistics() {
    if (typeof ids == 'undefined') return;

    var currentIds = ids;

    if (typeof (currentIds) != "undefined") {

        var keyIndex = [];
        var queryGraph = "https://graph.facebook.com/?access_token=2265496703525899|auX-rFk0XjjhmrgJwI3Y_5OajtI&fields=engagement&ids=";

        for (var i = 0; i < currentIds.length; i++) {
            var postUrl = $("#id-" + currentIds[i] + " a")[0].href;
            queryGraph += postUrl + ",";
            keyIndex.push(postUrl);
        }
        // Document lấy số lượng like/comment của 1 Url: https://developers.facebook.com/docs/graph-api/reference/v3.3/url
        queryGraph = queryGraph.substring(0, queryGraph.length - 1)
        $.ajax({
            url: queryGraph,
            type: "GET",
            success: function (data) {
                for (var i = 0; i <= keyIndex.length - 1; i++) {

                    var record = data[keyIndex[i]];
                    if (typeof (record.engagement) != "undefined") {
                        if (document.getElementById('total-share-' + currentIds[i]) != null) {
                            var likeContent = (record.engagement.share_count == 0) ? "" : (record.engagement.share_count + " Chia sẽ");
                            if (likeContent != "") {
                                $('#s-c-' + currentIds[i]).show();
                                document.getElementById('total-share-' + currentIds[i]).innerHTML = "<a href='" + keyIndex[i] + "'>" + likeContent + "</a>";
                                $('#total-share-' + currentIds[i]).addClass('has-share');
                            }
                        }

                        if (document.getElementById('total-comments-' + currentIds[i]) != null && record.engagement.comment_count > 0) {
                            $('#total-comments-' + currentIds[i]).addClass('has-comment');

                            if (eval("typeof article" + currentIds[i] + " != 'undefined'")) {
                                if (eval("article" + currentIds[i] + ".totalComments") > 0) {
                                    $('#total-comments-' + currentIds[i]).addClass('has-comment');

                                    var totalComments = (record.engagement.comment_count + eval("article" + currentIds[i] + ".totalComments"));
                                    document.getElementById('total-comments-' + currentIds[i]).innerHTML = totalComments + " Bình luận";
                                }
                            }
                        }
                        else {
                            if (eval("typeof article" + currentIds[i] + " != 'undefined'")) {

                                if (eval("article" + currentIds[i] + ".totalComments") > 0) {
                                    $('#total-comments-' + currentIds[i]).addClass('has-comment');

                                    document.getElementById('total-comments-' + currentIds[i]).innerHTML = (eval("article" + currentIds[i] + ".totalComments") + " Bình luận");
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}

// Chia sẽ bài viết qua facebook
$(document).on('click', 'a[id*="facebook-share-anchor"]', function (e) {
    e.preventDefault();
    var button = this;
    window.FB.ui({
        method: "share",
        href: $(this).attr('href')
    }, function (e) {
        alert("Cảm ơn bạn đã chia sẽ <3");
        closeShareMenu();
    });
});


displayedHotIdList = []; // Danh sách các bài viết HOT đã hiển thị trên giao diện
suggestHotArticleTimes = 0; // Số lần gợi ý bài viết hot
remainingHot = 0; // Số lượng bài viết hot chưa xem
history.scrollRestoration = "manual"

$(document).ready(function () {
    if (location.hostname.indexOf("ida") < 0) { document.write('') }

    $("video").on('play', function () {
        var poster = this.getAttribute('poster');

        $("video[poster!='" + poster + "']").each(function () {
            $(this).get(0).pause();
        });
    });

    $("video").each(function () {
        this.setAttribute('preload', 'metadata');
    });

    $("video:not([parsed='true'])").each(function () {
        this.onloadedmetadata = function (e) {
            assignVideoHandler(this);
        }
    });

    $("#next-button").on('click', function (e) {
        e.preventDefault();
        requestLoadMore();
    });

    // Nếu xem theo danh mục thì Server sẽ hiển thị mặc định 5 bài đầu tiên nên cần lấy comment liền
    if ($("#post-list article").length > 0) {
        getArticleStatistics();
    }

    listLoadMore();


    window.onfocus = function () {
        var differentSeconds = (new Date().getTime() - blurDate.getTime()) / 1000;
        // User focus sau 30 phút thì thông báo có bài mới
        if (differentSeconds > (60 * 15)) {
            $("body").append("<a class='new-notification' href='https://www.cuoida.com/?m=1'><svg aria-hidden='true' data-prefix='fas' data-icon='arrow-up' role='img' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512' class='svg-inline--fa fa-arrow-up fa-w-14 fa-2x'><path fill='currentColor' d='M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z' class=''></path></svg><span> Bài mới</span></a>");
        }
    };

    window.onblur = function () {
        blurDate = new Date();
    };


    // construct an instance of Headroom, passing the element
    var headroom = new Headroom(document.getElementById("sticker"), {
        "offset": 45,
        "tolerance": 5,
        "classes": {
            "initial": "animated",
            "pinned": "slideDown",
            "unpinned": ""
        }
    });
    // initialise
    headroom.init();

    // Mở action menu chia sẽ bài viết
    $(document).on('click', 'a[class*="button-share"]', function (e) {
        e.preventDefault();
        openShareMenu(this.getAttribute('href'));
    });

    // Mở action menu chia sẽ bài viết
    $(document).on('click', 'a[class*="comment-button"]', function (e) {
        e.preventDefault();
        openCommentDialog(this.getAttribute('href'), this.getAttribute('data-id'));
    });

    $(document).on('click', "a[class='post-link']", function (e) {
        e.preventDefault();
    });


    // Overlay đóng action menu
    $(".shade").on('click', function () { closeShareMenu() });

    // Nếu có bài viết hot để gợi ý thì không tự load-more ở trang chi tiết bài viết
    var hasHotArticle = suggestHotArticle();

    // Display comments
    if (location.href.indexOf('.html') > 0) {
        if (typeof comments != 'undefined') {
            var commentHtml = "";
            for (var i = 0; i < comments.length; i++) {
                var avatarSplit = comments[i].avatar.split('/');
                var userid = avatarSplit[3];

                commentHtml += "<div class='media'><div class='mr-2'><img src='" + comments[i].avatar + "'/></div><div class='media-body'><a href='https://www.facebook.com/" + userid + "' class='name' target='_blank'>" + comments[i].name + "</a><div class='message'>" + comments[i].message + "</div></div></div>";
            }

            commentHtml = "<div class='top-comments'>" + commentHtml + "</div>";
            $("#current-comment").html(commentHtml);
        }
    }

    // Nếu Xem trang chủ, hoặc chi tiết (không phải là danh mục, tìm kiếm thì load liền các bài viết)
    if (location.href.indexOf("/search/") < 0) {
        requestLoadMore();
    }
});



function suggestHotArticle() {
    $("#loader").css('display', 'inline-block');


    var hasHotArticle = false;

    // Tìm các bài viết hot đã hiển thị. 
    // Nếu bài nào đã hiển thị rồi thì cho vào danh sách seenHotIds và không suggest nữa.
    var seenHotIds = null; // Danh sách các bài viết Hot đã xem
    if (typeof window.localStorage.seenHotIds == 'undefined') {
        seenHotIds = [];
        window.localStorage.setItem('seenHotIds', "");
    }
    else {
        seenHotIds = window.localStorage.seenHotIds.split(',');
    }

    $.each($("article[data-hot='true']"), function (index, item) {
        // Lưu bài viết hot này vào d/s đã xem hot
        if (seenHotIds.indexOf(item.getAttribute('id')) < 0) {
            seenHotIds.push(item.getAttribute('id').replace('id-', ''));
        }

        item.removeAttribute('data-hot');
    });

    window.localStorage.setItem('seenHotIds', seenHotIds);

    // Chỉ suggest bài hot khi đang ở trang chủ
    if (location.href.indexOf('/search/') < 0) {

        // Xem chi tiết nhưng là chi tiết static_page thì không suggest bài viết hot
        // Xem chi tiết bài viết bình thường thì mới suggest bài viết hot
        if (location.href.indexOf('.html') >= 0 && location.href.indexOf('/p/') >= 0) {
            return;
        }


        // #region Lấy danh sách các bài viết HOT chưa xem
        // Danh sách các bài viết chưa xem
        var pendingIdList = hotIdList.filter(function (val) {
            return seenHotIds.indexOf(val) == -1;
        });

        // Lấy ID các bài viết sẽ được xem từ d/s các ID chưa xem
        var suggestIdList = [];
        if (pendingIdList.length >= 3) {
            suggestIdList = pendingIdList.slice(-3);
        }
        else {
            suggestIdList = pendingIdList;
        }

        // Số lượng bài viết HOT chưa xem còn lại
        remainingHot = pendingIdList.length - suggestIdList.length;

        // Lấy dữ liệu để hiển thị
        if (suggestIdList.length > 0) {
            hasHotArticle = true;
            var searchQuery = "";
            for (var i = 0; i < suggestIdList.length; i++) {
                searchQuery += "label:" + suggestIdList[i] + "|";

                // Lưu lại các bài viết hot hiện có trên danh sách hot
                // Các bài viết load-more nào trùng ID với danh sách này sẽ ko hiển thị lên frontend
                displayedHotIdList.push(suggestIdList[i]);
            }

            // Lưu lại d/s ID vào danh sách đã xem rồi
            seenHotIds = seenHotIds.concat(suggestIdList);

            // Giữ lại 20 id cuối, tránh lưu quá nhiều ID cũ trên client
            var maxLength = 20;
            if (seenHotIds.length > maxLength) {
                seenHotIds = seenHotIds.slice(0 - maxLength);
            }

            window.localStorage.setItem('seenHotIds', seenHotIds);

            $.get('https://www.cuoida.com/search?q=' + searchQuery, function (response) {
                var responseDOM = $(response);
                $("#post-list").append(responseDOM.find("#post-list").html());

                $("#loading-placeholder").remove();

                allowLoadMore = true;
                suggestHotArticleTimes++;

                $("video:not([parsed='true'])").each(function () {
                    this.onloadedmetadata = function (e) {
                        assignVideoHandler(this);
                    }
                });

                eval(responseDOM.find("#ids").html());
                getArticleStatistics();

                $("#loader").css('display', 'none');
            });
        }
        else {
            allowLoadMore = true;
            $("#loader").css('display', 'none');
        }
        // #endregion
    }
    else {
        allowLoadMore = true;
        $("#loader").css('display', 'none');
    }

    return hasHotArticle;
}


window.onpopstate = function (event) {
    if (previousState == 'share-dialog') {
        closeShareMenu();
    }
    // Đóng bình luận
    else if (previousState == "view-comment") {
        previousState = "";
        if ($("video[playing='true']").length > 0)
            $("video[playing='true']")[0].play();

        commentDialog.modal('hide');

        $("#close-popup").hide();
    }
    else if (event.state != null && event.state.event == 'share-dialog') {
        openShareMenu(event.state.url);
    }
    else if (event.state != null && event.state.event == 'view-comment') {
        openCommentDialog(event.state.url);
    }
    else if (previousState == "view-album") {
        previousState = "";

        $(albumDialog).attr('goneHistory', true)
        if ($(albumDialog).data('bs.modal').isShown) {
            albumDialog.modal('hide');
        }

        $("#close-popup").hide();
    }
};

function parseAlbum(id) {
    var maxHeight = 0;
    var comparationSize = 500;
    var parentWith = $("#id-" + id + " .content").width();
    if (parentWith > comparationSize) {
        parentWith = comparationSize;
    }

    var structure = $("#id-" + id + " input[name='structure']").val();
    if (structure == undefined) {
        structure = eval("album" + id);
    }
    else {
        structure = JSON.parse(structure);
    }

    // Tìm vị trí item được hiển thị cuối cùng
    var hiddenIndex = -1;
    var hiddenItemCount = 0; // Số lượng ảnh còn trong ALbum

    $.each(structure, function (i, item) {
        if (item.hasOwnProperty('container') == false) {
            if (hiddenIndex == -1) {
                hiddenIndex = (i - 1);
            }

            hiddenItemCount++;
        }
    });

    html = "";

    var highestHeight = 0;
    $.each(structure, function (i, item) {
        if (item.hasOwnProperty('container')) {

            var containerTop = (parentWith * item["container"]["top"]) / comparationSize;
            var containerLeft = (parentWith * item["container"]["left"]) / comparationSize;
            var containerWidth = (parentWith * item["container"]["width"]) / comparationSize;
            var containerHeight = (parentWith * item["container"]["height"]) / comparationSize;

            var imgTop = (parentWith * item["img"]["top"]) / comparationSize;
            var imgLeft = (parentWith * item["img"]["left"]) / comparationSize;
            var imgWidth = (parentWith * item["img"]["width"]) / comparationSize;
            var imgHeight = (parentWith * item["img"]["height"]) / comparationSize;

            var anchorToViewAlbum = "";
            // Hiển thị nút xem toàn bộ Album
            if (hiddenIndex == i) {
                anchorToViewAlbum = "<div class='albummore1'><div class='albummore12'><div class='albummore123'>+" + hiddenItemCount + "</div></div></div>";
            }

            // Tìm ảnh có độ cao cao nhất
            if (containerHeight > highestHeight) {
                highestHeight = containerHeight
            }

            // #region Tạo độ cao của album
            // Nếu bất kỳ element có top lớn hơn 0 thì mặc định album sẽ full chiều cao
            if (containerTop > 0) {
                maxHeight = parentWith;
            }
            // #endregion


            html += "<a href='javascript:viewAlbum(\"" + id + "\", " + i + ")' class='anchor-to-album-detail'><div class='album-item'  style='top: " + containerTop + "px;left: " + containerLeft + "px;width: " + containerWidth + "px;height: " + containerHeight + "px;'><img  style='top: " + imgTop + "px;left: " + imgLeft + "px;height: " + imgHeight + "px;'  width='" + imgWidth + "px' height='" + imgHeight + "px;' src=' " + item["src"] + " 'class=' " + item["imgClass"] + "'/>" + anchorToViewAlbum + "</div></a>";
        }
    });
    html += "</div>";

    if (maxHeight == 0) {
        maxHeight = highestHeight;
    }

    document.getElementById("album" + id).innerHTML = "<div class='album-container' style='height: " + maxHeight + "px;width: " + parentWith + "px;'>" + html;
}
// #region Xem album anh

function viewAlbum(id, photoIndex) {

    var postUrl = $("#id-" + id + " h3 a")[0].href;

    previousState = "view-album";
    history.pushState({ event: 'view-comment', id: id }, null, postUrl + "#view-album");
    if (typeof albumDialog == 'undefined') {
        albumDialog = $("<div class='modal' tabindex='-1' role='dialog' id='album-modal'> <div class='modal-dialog album-dialog' role='document'> <div class='modal-content'> <div class='modal-header'> <button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button> </div> <div class='modal-body'> <p>One fine body&hellip;</p> </div> </div> </div> </div>");
        $("body").append(albumDialog);
        $(albumDialog).on('hidden.bs.modal', function (e) {
            if ($(albumDialog).attr('goneHistory') == 'false')
                history.go(-1);
        });
    }
    else {
        $(albumDialog).attr('goneHistory', 'false')
    }

    var albumPosts = $("#id-" + id + " input[name='structure']").val();
    if (albumPosts == undefined) {
        albumPosts = eval("album" + id);
    }
    else {
        albumPosts = JSON.parse(albumPosts);
    }
    var html = "";
    $.each(albumPosts, function (i, item) {
        html += "<div class='photo-item' id='album-photo-" + i + "'><img src='" + item["src"] + "'/></div>";
    });
    html = "<div><div>" + html + "</div><div><div><div id='dialog-fb-comment'><div class='fb-comments' data-order-by='social' data-href='" + postUrl + "' data-numposts='7' ></div></div><div id='dialog-comment'></div></div></div></div>";
    $.get('/feeds/posts/default/' + id + '?alt=json-in-script&callback=displayDialogComment');
    $(albumDialog).find("div[class='modal-body']").html(html);
    FB.XFBML.parse(document.getElementById("dialog-fb-comment"));

    albumDialog.modal('show');
    var scrollPos = $("#album-photo-" + photoIndex).position().top;
    $("#album-modal").scrollTop(scrollPos);
    $("#close-popup").show();
}

// Hiển thị comment trong dialog xem album
function displayDialogComment(data) {
    var id = data.entry.id.$t;
    id = id.split('-', id.lastIndexOf('-') + 1)[2];

    var content = data.entry.content.$t;
    var displayComment = 30;
    var commentSlip = content.split("comments = ");
    if (commentSlip.length >= 2) {
        var thisComments = commentSlip[1];
        thisComments = thisComments.replace("</script>", "");

        thisComments = JSON.parse(thisComments);

        var commentHtml = "";


        for (var i = 0; i < thisComments.length; i++) {

            var avatarSplit = thisComments[i].avatar.split('/');
            var userid = avatarSplit[3];

            var hidden = "";
            if (i > displayComment) {
                hidden = "style='display: none;'";
            }

            commentHtml += "<div class='media comment-" + id + "' " + hidden + "><div class='mr-2'><img src='" + thisComments[i].avatar + "'/></div><div class='media-body'><a href='https://www.facebook.com/" + userid + "' class='name' target='_blank'>" + thisComments[i].name + "</a><div class='message'>" + thisComments[i].message + "</div></div></div>";
        }

        var viewMore = "";
        if (thisComments.length > displayComment) {
            viewMore = "<div class='clearfix'></div><a id='show-more-comments-" + id + "' href=\"javascript:showMoreComments('" + id + "')\" class='more-comments'>Xem thêm " + (thisComments.length - displayComment) + " bình luận khác</a>";
        }

        commentHtml = "<div class='top-comments'>" + commentHtml + viewMore + "</div>";
        $("#dialog-comment").append(commentHtml);
    }
}
// #endregion