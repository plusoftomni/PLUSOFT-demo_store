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
  $(window).on("plusoftOmniEmbeddedOpened", function(){ toastr["success"]("Embedded aberto.", titleNotification) });
  $(window).on("plusoftOmniEmbeddedMinimized", function(){ toastr["success"]("Embedded minimizado.", titleNotification) });
  $(window).on("plusoftOmniEmbeddedClosed", function(){ toastr["success"]("Embedded fechado", titleNotification) });
  $(window).on("plusoftOmniEmbeddedChatStarted", function(){ toastr["success"]("Embedded chat iniciado", titleNotification) });
  $(window).on("plusoftOmniEmbeddedChatRestarted", function(){ toastr["success"]("Embedded chat reiniciado", titleNotification) });
  $(window).on("plusoftOmniEmbeddedChatClosed", function(){ toastr["success"]("Embedded chat finalizado", titleNotification) });
});