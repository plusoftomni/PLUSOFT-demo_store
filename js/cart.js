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

  /* Embedded status listener */
  $(window).on("plusoftOmniEmbeddedOpened", function(){ sendNotificaton("Embedded aberto"); updateVariables(); });
  $(window).on("plusoftOmniEmbeddedMinimized", function(){ sendNotificaton("Embedded minimizado"); updateVariables(); });
  $(window).on("plusoftOmniEmbeddedClosed", function(){ sendNotificaton("Embedded fechado"); updateVariables(); });

  /* Chat status listener */
  $(window).on("plusoftOmniEmbeddedChatInit", function(){ sendNotificaton("Embedded chat na tela de apresentação"); updateVariables(); });
  $(window).on("plusoftOmniEmbeddedChatQueue", function(){ sendNotificaton("Embedded chat em fila"); updateVariables(); });
  $(window).on("plusoftOmniEmbeddedChatStarted", function(){ sendNotificaton("Embedded chat iniciado"); updateVariables(); });
  $(window).on("plusoftOmniEmbeddedChatRestarted", function(){ sendNotificaton("Embedded chat reiniciado"); updateVariables(); });
  $(window).on("plusoftOmniEmbeddedChatFinished", function(){ sendNotificaton("Embedded chat finalizado"); updateVariables(); });


  function sendNotificaton(msg) {
  	toastr["success"](msg, titleNotification);
  }


  function updateVariables() {

  }
});