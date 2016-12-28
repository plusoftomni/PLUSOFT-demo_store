$(document).ready(function() {
	var titleNotification = "Plusoft OmniChat";

  	toastr.options = {
	  "closeButton": true,
	  "debug": false,
	  "newestOnTop": false,
	  "progressBar": true,
	  "positionClass": "toast-top-right",
	  "preventDuplicates": false,
	  "onclick": null,
	  "showDuration": "150",
	  "hideDuration": "1000",
	  "timeOut": "5000",
	  "extendedTimeOut": "1000",
	  "showEasing": "swing",
	  "hideEasing": "linear",
	  "showMethod": "fadeIn",
	  "hideMethod": "fadeOut"
	}


  /* example listener variables */
  var intervalVariables = setInterval(function() {
  	internalVariablesFn();
  }, 1000);

  var internalVariablesFn = function(){
  	updateVariables();
  };

  /* external actions of embedded */
  $("#opene").on("click", function(e) { openChat(); });
  $("#minimizee").on("click", function(e) { minimizeChat(); });
  $("#closee").on("click", function(e) { closeChat(); });
  $("#datae").on("click", function(e) { sendDataChat(); });

  function openChat() {
  	if (window.plusoftOmniChat && window.plusoftOmniChat.loaded == true) {
  	  new window.plusoftOmniChat.messageBroadcaster("omnichat.open_conversation", "open", { serialize: true, domains: ["https:" + window.plusoftOmniChat.base], context: document.getElementById("plusoftOmniChatMain").contentWindow, origin: "internal" });
  	} else {
  		toastr["error"]("Embedded não carregado", titleNotification);
  	}
  }

  function minimizeChat() {
  	if (window.plusoftOmniChat && window.plusoftOmniChat.loaded == true) {
  	  new window.plusoftOmniChat.messageBroadcaster("omnichat.minimize_conversation", "minimize", { serialize: true, domains: ["https:" + window.plusoftOmniChat.base], context: document.getElementById("plusoftOmniChatMain").contentWindow, origin: "internal" });
  	} else {
  		toastr["error"]("Embedded não carregado", titleNotification);
  	}	
  }

  function closeChat() {
  	if (window.plusoftOmniChat && window.plusoftOmniChat.loaded == true) {
  	  new window.plusoftOmniChat.messageBroadcaster("omnichat.close_conversation", "close", { serialize: true, domains: ["https:" + window.plusoftOmniChat.base], context: document.getElementById("plusoftOmniChatMain").contentWindow, origin: "internal" });
  	} else {
  		toastr["error"]("Embedded não carregado", titleNotification);
  	}
  }
  function sendDataChat() {
  	if (window.plusoftOmniChat && window.plusoftOmniChat.loaded == true && window.plusoftOmniChat.status.conversation == "active") {
  	  window.plusoftOmniChat.updateUserData({"key": "plusoft-test", "value":"teste"});
  	} else {
  		toastr["error"]("Embedded não carregado e/ou sem conversa ativa", titleNotification);
  	}
  }
  

  /* Embedded status listener */
  $(window).on("plusoftOmniEmbeddedOpened", function(){ sendNotificaton("Embedded aberto"); });
  $(window).on("plusoftOmniEmbeddedMinimized", function(){ sendNotificaton("Embedded minimizado"); });
  $(window).on("plusoftOmniEmbeddedClosed", function(){ sendNotificaton("Embedded fechado"); });

  /* Chat status listener */
  $(window).on("plusoftOmniEmbeddedChatInit", function(){ sendNotificaton("Embedded chat na tela de apresentação"); });
  $(window).on("plusoftOmniEmbeddedChatQueue", function(){ sendNotificaton("Embedded chat em fila"); });
  $(window).on("plusoftOmniEmbeddedChatStarted", function(){ sendNotificaton("Embedded chat iniciado"); });
  $(window).on("plusoftOmniEmbeddedChatRestarted", function(){ sendNotificaton("Embedded chat reiniciado"); });
  $(window).on("plusoftOmniEmbeddedChatFinished", function(){ sendNotificaton("Embedded chat finalizado"); });


  function sendNotificaton(msg) {
  	toastr["success"](msg, titleNotification);
  }


  function updateVariables() {
  	$("#statusLoaded").find(".value").text(window.plusoftOmniChat.loaded);
  	$("#statusConversation").find(".value").text(window.plusoftOmniChat.status.conversation);
  	$("#statusEmbedded").find(".value").text(window.plusoftOmniChat.status.embedded);
  	$("#controlRestarted").find(".value").text(window.plusoftOmniChat.control.restarted);
  	$("#controlFinished").find(".value").text(window.plusoftOmniChat.control.finished);
  }
});