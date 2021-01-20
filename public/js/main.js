/**
 *
 * Created by killer on 2016/10/23.
 */
var videos = document.getElementById("videos");
var sendBtn = document.getElementById("sendBtn");
var msgs = document.getElementById("msgs");
var sendFileBtn = document.getElementById("sendFileBtn");
var files = document.getElementById("files");
var rtc = SkyRTC();

/**********************************************************/
$('#msgIpt').keypress(function(e){
    var curKey = e.which;
    if(curKey == 13)
    {
        var msgIpt = document.getElementById("msgIpt"),
            msg = msgIpt.value,
            p = document.createElement("p");
        p.innerText = "me: " + msg;
        //Broadcast message
        rtc.broadcast(msg);
        msgIpt.value = "";
        msgs.appendChild(p);
        $("#msgs").scrollTop($("#msgs")[0].scrollHeight);
    }
});

sendBtn.onclick = function(event){
    var msgIpt = document.getElementById("msgIpt"),
        msg = msgIpt.value,
        p = document.createElement("p");
    p.innerText = "me: " + msg;
    //Broadcast message
    rtc.broadcast(msg);
    msgIpt.value = "";
    msgs.appendChild(p);
    $("#msgs").scrollTop($("#msgs")[0].scrollHeight);
};

sendFileBtn.onclick = function(event){
    //Share files
    rtc.shareFile("fileIpt");
};
/**********************************************************/



//The other party agrees to receive the file
rtc.on("send_file_accepted", function(sendId, socketId, file){
    var p = document.getElementById("sf-" + sendId);
    p.innerText = "Received by the other party " + file.name + " file, waiting to be sent";

});
//The other party refused to receive the file
rtc.on("send_file_refused", function(sendId, socketId, file){
    var p = document.getElementById("sf-" + sendId);
    p.innerText = "The other party refuses to accept " + file.name + " file";
});
//Request file
rtc.on('send_file', function(sendId, socketId, file){
    var p = document.createElement("p");
    p.innerText = "Request to send " + file.name + " file";
    p.id = "sf-" + sendId;
    msgs.appendChild(p);
});
//File sent successfully
rtc.on('sended_file', function(sendId, socketId, file){
    var p = document.getElementById("sf-" + sendId);
    p.parentNode.removeChild(p);
});
//Send file fragments
rtc.on('send_file_chunk', function(sendId, socketId, percent, file){
    var p = document.getElementById("sf-" + sendId);
    p.innerText = file.name + "File is sending: " + Math.ceil(percent) + "%";
});
//Accept file fragmentation
rtc.on('receive_file_chunk', function(sendId, socketId, fileName, percent){
    var p = document.getElementById("rf-" + sendId);
    p.innerText = "Receiving " + fileName + " file： " +  Math.ceil(percent) + "%";
});
//File received
rtc.on('receive_file', function(sendId, socketId, name){
    var p = document.getElementById("rf-" + sendId);
    p.parentNode.removeChild(p);
});
//An error occurred while sending the file
rtc.on('send_file_error', function(error){
    console.log(error);
});
//An error occurred while receiving the file
rtc.on('receive_file_error', function(error){
    console.log(error);
});
//File sending request received
rtc.on('receive_file_ask', function(sendId, socketId, fileName, fileSize){
    var p;
    if (window.confirm(socketId + " user wants to send you " + fileName + " file with size " + fileSize + "KB, accept?")) {
        rtc.sendFileAccept(sendId);
        p = document.createElement("p");
        p.innerText = "Ready to receive " + fileName + " file";
        p.id = "rf-" + sendId;
        msgs.appendChild(p);
    } else {
        rtc.sendFileRefuse(sendId);
    }
});
//Successfully created WebSocket connection
rtc.on("connected", function(socket) {
    //Create a local video stream
    rtc.createStream({
        "video": true,
        "audio": true
    });
    //Successfully created AJAX sends the socketid back to the server
    $.post(
        "connectSuccess",
        {
            socketId: rtc.me
        }
    );
});
//Create local video stream successfully
rtc.on("stream_created", function(stream) {
    document.getElementById('me').src = URL.createObjectURL(stream);
    document.getElementById('me').play();
});
//Failed to create local video stream
rtc.on("stream_create_error", function() {
    alert("create stream failed!");
});
//Receive video streams from other users
rtc.on('pc_add_stream', function(stream, socketId) {
    var newDiv = document.createElement("div");
    newDiv.setAttribute("class","brick small");

    var newSpan = document.createElement("span");

    var newVideo = document.createElement("video"),
        id = "other-" + socketId;
    newVideo.setAttribute("class", "other");
    newVideo.setAttribute("autoplay", "autoplay");
    newVideo.setAttribute("controls", "controls");
    newVideo.setAttribute("id", id);

    newSpan.appendChild(newVideo);
    newDiv.appendChild(newSpan)
    videos.appendChild(newDiv);
    rtc.attachStream(stream, id);
    $('.gridly').gridly('layout');
});
//Delete other users
rtc.on('remove_peer', function(socketId) {
    var video = document.getElementById('other-' + socketId);
    if(video){
        video.parentNode.parentNode.parentNode.removeChild(video.parentNode.parentNode);
    }
});
//Text message received
rtc.on('data_channel_message', function(channel, socketId, message){
    var p = document.createElement("p");
    p.innerText = socketId + ": " + message;
    msgs.appendChild(p);
});
//Connect to WebSocket server
rtc.connect("wss:" + window.location.href.substring(window.location.protocol.length).split('#')[0], window.location.hash.slice(1));