/*
 * Default JavaScript engine for inPaaS Dynamic Forms
 */
(function($, d) {
	
	window.dynaform = {
		events: { },
		initial: [ ],
		cleanup: [ ]
	};
	
	window.dynaform.init = function(scope) {
		$.each(window.dynaform.initial, function(index, el) {
			try {
				el(scope);
			} catch(e) {
				console.log("%cError occurried while loading initial script: \n %o", "color: #cc0000;", e.stack);
			}
		});
		
		window.dynaform.initial = [];
	};
	
	window.dynaform.exit = function(scope) {
		$.each(window.dynaform.cleanup, function(index, el) {
			try {
				el(scope);
			} catch(e) {
				console.log("%cError occurried while loading unload script: \n %o", "color: #cc0000;", e.stack);
			}
		});
	};
	
	window.dynaform.iframeload = function(e) {

	};
	
	/*
	 * Load
	 * 
	 * usage:
	 * 
	 * Load an URL inside the middle iframe 
	 * window.dynaform.load(url)
	 * 
	 * Load a Form inside the middle iframe wiht the given recordId loaded
	 * window.dynaform.load(formkey, recordid)
	 * 
	 * Load a Form using ajax, send the content to the callback and load the initial script.
	 * window.dynaform.load(formkey, recordid, callback)
	 */
	window.dynaform.load = function(formkey, recordid, params, callback) {
		if (typeof(params) == "function") {
			callback = params;
			params = null;
		}
		
		if (arguments.length == 1) {
			var furl = formkey;
			
			/* ga-code (dynaform-load) */
			ga('send', 'event', 'dynaform', 'load', { "url": furl });

			window.location.href = furl;
			
		} else if (callback == null) {
			if (recordid == undefined) recordid = "";
			
			/* ga-code (dynaform-load) */
			ga('send', 'event', 'dynaform', 'load', { "form": formkey, "record-id": recordid });

			var furl = "/forms/" + formkey + "/" + recordid;
			if (params != null) furl += "?" + $.param(params);

			window.location.href = furl;

			
		} else if (callback != null) {
			if (recordid == undefined) recordid = "";

			/* ga-code (dynaform-load) */
			ga('send', 'event', 'dynaform', 'load', { "form": formkey, "record-id": recordid });
			
			var furl = "/forms/" + formkey + "/" + recordid;
			dynaform.ajax({ url: furl, type: "GET", cache: false, dataType: "html" }, function(data, textStatus, jqXHR) {
				var $page = $(data);
				
	          	// Load the form content (callback could return the form scope, to run the script)
				callback($page[0]);
				
			});
			
		}
		
	};
	
	window.dynaform.modal = function(formkey, recordid, options) {
		var opts = $.extend({
			onload: function($modal) {},
			onclose: function(e) {},
			oncancel: function(e) {},
			onconfirm: function(e) {}
		}, options);
		
		dynaform.load(formkey, recordid, function(ajaxform) {
			var $modal = $("<div class='modal fade'></div>").append(ajaxform);
			$modal.find(".modal-header").prepend("<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>")
			$modal.modal();

			var scope = $modal.find("form");

			$modal.on('hidden.bs.modal', function (e) {
				opts.onclose(e);
				
				$(this).remove();
			});
			
			$modal.on('shown.bs.modal', function(e) {
				var scope = $(this).find("form");
				
				window.dynaform.init(scope);
				window.dynaform.libraries.load(scope, "dynaform");
				window.dynaform.libraries.load(scope, "datatable");
				window.dynaform.libraries.load(scope, "widget");
				window.dynaform.libraries.load(scope, "datetimepicker");
				window.dynaform.libraries.load(scope, "jquery.mask");
				window.dynaform.libraries.load(scope, "jquery.validate");
				window.dynaform.libraries.load(scope, "fullcalendar");
				window.dynaform.libraries.load(scope, "tooltip");
				
				
			})
			
			$modal.on("click", ".btn-primary", opts.onconfirm)
			$modal.on("click", "[role=cancel]", opts.oncancel)
			
			opts.onload($modal);
			
			return scope;
        });
	}
		
	/*
	 * Push functions to the engine load
	 */
	window.dynaform.onload = function(cb) {
		if(typeof cb == "function") { 
			window.dynaform.initial.push(cb);
		} else {
			console.error(".onload( callback )\nMissing parameter or wrong parameter type \'callback\' should be a function.\nSupplied parameter is %s", typeof cb);
		}
	};
	
	/*
	 * Push function to the engine cleanup
	 */
	window.dynaform.onunload = function(cb) {
		if(typeof cb == "function") { 
			scope.cleanup.push(cb);
		}
	}
	
	window.dynaform.save = function(form, opts) {
		var scope = $(form);
		
		/* ga-code (dynaform-save) */
		var fkey =  scope.attr("form-key");
		var recordId = scope.find("[record-id]").val();
		
		/*
		 * Check operation permission for current execution
		 */
		var cannotUpdate = !scope.is("[data-permission-update]");
		var cannotInsert = !scope.is("[data-permission-insert]");

		if ((recordId && cannotUpdate) || (!recordId && cannotInsert)) {
			opts.element.loading("done");
			return false;
		}
		
		ga('send', 'event', 'dynaform', 'save', { "form": fkey, "record-id": recordId });
		
		// Template fields must not be validated
		scope.find("table thead th input").attr("disabled", "disabled");
		
		if ($.fn.validate && !scope.valid()) {

			var $errel = scope.find(".error");
			
			$("body").animate({ 
				"scrollTop":$errel.offset().top - 100
			});
			
			if (opts.element) opts.element.loading("done");
			
			return false;
		}
		
		// Unique value for back-end identification
		scope.find("table thead th input").removeAttr("disabled", "disabled");
		scope.find("table thead th input").val("dynaform-template-field");
		
		// Unload the HTML-Editors
		window.dynaform.libraries.unload(scope, 'htmleditor')
		
		var targetUrl = scope.attr("action");
		// var formdata = scope.getFormData();
		
		var postdata = {
				url: targetUrl,
				cache: false,
				type: "POST"
		}
		if (scope.find("input[type=file][name]").length > 0) {
			postdata["data"] = new FormData(scope[0]);
			postdata["contentType"] = false;
			postdata["processData"] = false;
			
		} else {
			postdata["data"] = scope.serialize();

		}
		
		dynaform.ajax(postdata, function(data, textStatus, jqXHR) {
			scope.trigger("aftersave", {
				data 	: data,
				element : opts.element
			});
			
		});
		
		return true;
	};
	
	window.dynaform.duplicate = function(form) {
		var $form = $(form);
		
		/* ga-code (dynaform-save) */
		var fkey =  $form.attr("form-key");
		var rid = $form.find("[record-id]").val();
		
		/*
		 * Check operation permission for current execution
		 */
		if(!$form.is("[data-permission-insert]")) return false;
		
		ga('send', 'event', 'dynaform', 'duplicate', { "form": fkey, "record-id": rid });
		
		var url = "/forms/" + fkey;
		$form.attr('action', url);
		$form.find('[record-id]').val('');
		$($form.find('[autofocus]')[0]).focus();
		window.history.pushState({}, window.document.title, "/forms/" + fkey);
	};
	
	window.dynaform.confirm = function(title, message, onconfirm) {
		var $page = $(".page-content");
		
		var $modal = $($.fn.dynaform.defaults.htmlConfirm);
		$modal.find(".modal-title").append(title);
		$modal.find(".modal-body > p").append(message);
		
		$modal.modal();
		
		$modal.find(".btn-primary").on("click", function(e) {
			onconfirm();
			
			$(".dynaform-modal").modal('hide');
		});
		
		$modal.on('hidden.bs.modal', function (e) {
			$modal.remove();
		});
	};

	window.dynaform.alert = function(title, message, onconfirm) {
		var $page = $(".page-content");
		
		var $modal = $($.fn.dynaform.defaults.htmlAlert);
		$modal.find(".modal-title").append(title);
		$modal.find(".modal-body > p").append(message);
		
		$modal.modal();
		
		$modal.find(".btn-primary").on("click", function(e) {
			onconfirm();
			
			$(".dynaform-modal").modal('hide');
		});
		
		$modal.on('hidden.bs.modal', function (e) {
			$modal.remove();
		});
		
		return $modal;
	};
	
	window.dynaform.remove = function(fkey, rid, callback) {
		/* ga-code (dynaform-remove) */
		ga('send', 'event', 'dynaform', 'remove', { "form": fkey, "record-id": rid });
		
		dynaform.ajax({
			type: "DELETE",
			url: "/forms/" + fkey + "/" + rid
		}, callback)
	};
	
	window.dynaform.ajax = function(options, callback) {
		var opts = $.extend({
			type: "POST",
			cache: "false",
			success: function(data, textStatus, jqXHR) {
				if (typeof(data) == "object") {
					try {
						if (data.error == null) {
							if (data.message) {
								$.notify(data.message);
							}
							callback(data, "success", jqXHR);
	
						} else {
							console.error(data);

							if (data.message) { 
								ga('send', 'exception', { 'exDescription': data.error, 'exFatal': false });
								
								$.notify(data.message, { autoHide: false, className: 'error' });
							}
							callback(data, "error", jqXHR);
						}
						
					} catch(e) {
						console.log("error: %o", e);
					}
				} else {
					callback(data, textStatus, jqXHR);
				}
			},
			error: function(jqXHR, textStatus, errorThrown) { 
				try {
					var data = jqXHR.responseJSON;
					if (!data) {
						data = { 
							type: "error",
							error: errorThrown, 
							message: errorThrown,
							status: textStatus
						};
					}

					ga('send', 'exception', { 'exDescription': data.error, 'exFatal': false });

					$.notify(data.message, { autoHide: false, className: 'error' });
					callback(data, "error", jqXHR);
					
				} catch(e) {
					console.log("error: %o", e);
					
				}
				
			}
		}, options);
		
		$.ajax(opts);
	};
	
	/*
	 * Configure permissions
	 */
	window.dynaform.setPermissions = function(scope) {
		var recordId = scope.find("[record-id]").val();
		
		var cannotInsert = !scope.is("[data-permission-insert]");
		var cannotUpdate = !scope.is("[data-permission-update]");
		var cannotDelete = !scope.is("[data-permission-delete]");
		
		if (cannotInsert)  
			scope.find("[role=new],[role=duplicate]").attr("disabled", "disabled").addClass("btn-disabled");
			
		if ((recordId && cannotUpdate) || (!recordId && cannotInsert)) 
			scope.find("[role=save]").attr("disabled", "disabled").addClass("btn-disabled");
			
		if (cannotDelete) 
			scope.find("[role=remove]").attr("disabled", "disabled").addClass("btn-disabled");

	}
	
})(jQuery, document);

/*
 * Default functionality for the notification worker
 */
dynaform.onload(function(scope) {
	// if ( window.top.inPaaS != undefined) {
	// 	$(window).blur(function(){
	// 		if (window.top.inPaaS.notification==undefined) return;
			
	// 		window.top.inPaaS.notification.worker.pause();
	// 	});
		
	// 	$(window).focus(function(){
	// 		if (window.top.inPaaS.notification==undefined) return;
			
	// 		window.top.inPaaS.notification.worker.unpause();
	// 	});
	// }

	var msg = $("div[role=messages-feed] span[role=error-message]").text();
	if(msg && msg!="") {
		ga('send', 'exception', { 'exDescription': msg, 'exFatal': false });

		$.notify(msg, { autoHide: false, className: 'error' });
	}
});

/*
 * Funcionalidade padrao para filtros de select
 */
dynaform.onload(function(scope) {
	scope.on("beforefilter", "select", function(event) {
		// alert("O campo foi filtrado e esse codigo esta na plataforma...");
		$(this).addClass("loading").attr("disabled", "disabled");
		
	});
});

/*
 * InPaaS Dynamic Forms
 */
(function($) {
	
  	$.fn.backdrop = function(options) {
        var opts = $.extend({}, $.fn.backdrop.defaults, options);

        $("<div class='" + opts.backdropClass + "'></div>").on("click", function(e) { 
        	$(this).remove();
          	opts.onclick();
        }).appendTo(opts.container);
      
      	return this;
    }

    $.fn.backdrop.defaults = {
		backdropClass: "modal-backdrop fade in",
      	container: ".page-content",
      	onclick: function() { }
	};
    
})(jQuery);

/**
 * Fixed filter
 * @param $target jQuery Selector for the target field that must be reloaded
 */
dynaform.filter = function($target, options) {
	if($target === undefined) return;
	
	var pushdata = {
		filter : $target.attr('form-field-id')
	};
	
	// Scope containing all the fields that must be used on the request
	var $fields = [];
	
	
	
	/* 
	 * Fixed and Dynamic Filters 
	 */
	if($target.is('[id]')){
		
		// Search for the fields that are from 'filter-field' role and has the same 'data-target' of the target field
		//$fields = $('[name][role=filter-field][data-target=' + $target.prop('id') + ']');
		$fields = $('[name][data-target=' + $target.prop('id') + ']');
	}
	
	/*
	 * Field Dependencies (Parent Filters)
	 */
	if($target.is('[depends]')){
		
		// Dependencies are comma delimitted
		var depends = $target.attr('depends').split(',');
		for (var c=0;c<depends.length;c++)
			$fields.push($("[form-field-id=" + depends[c] + "]"));
		
	}
	
	// Iterate over the fields scope and mount the push data
	for(var c=0;c<$fields.length;c++){
		var $field = $($fields[c]); 
		if($field.val()) {
			pushdata[$field.attr('name')] = $field.val();
		}
	}
	
	// Unload datatable lib
	window.dynaform.libraries.unload($target, "datatable");
	window.dynaform.libraries.unload($target, "fusioncharts");

	$target.trigger("beforefilter", [ pushdata ]);
	
	// Request the filtering action
	$.ajax({
		url: $target.closest("form").attr("action"),
		type: "GET",
		data: pushdata,
		success: function(data, textStatus, jqXHR) {
			
			// Update html
			$("[form-field-id=" + pushdata.filter + "]").replaceWith(data);

			// Load datatable lib
			var $target = $("[form-field-id=" + pushdata.filter + "]"); 

			// Load datatable lib
			window.dynaform.libraries.load($target.parent(), "datatable");
			window.dynaform.libraries.load($target.parent(), "fusioncharts");

			$target.trigger("afterfilter", [ pushdata, data ]);
			
			if(options && options.oncomplete)
				options.oncomplete();
		}
	});
};

/*
 * Dynaform jQuery Plugin
 * @author jvarandas
 */
(function($, engine) {
	
	$.fn.dynaform = function(options) {
		var opts = $.extend({}, $.fn.dynaform.defaults, options);
		
		if ($.fn.validate) this.validate(opts.optionsValidate);
		
		window.dynaform.setPermissions(this);

		this.data("js-postdata", {});

		this.on("click", "input[type=checkbox]", function(e) {
			var hval = this.checked ? this.value : $(this).attr("false-value");
			
			$(this).siblings("input[role=checkbox-hdn]").val(hval)
		});

		this.on("click", "button[role=edit]", function(e) {
			var $this = $(this);
			
			var rowid = $this.closest("tr[row-id]").attr("row-id");
			
			var formtarget = $this.attr("form-target");
			
			if (formtarget == null) {
				formtarget = e.delegateTarget.getAttribute("form-key").replace(".list", ".edit");
			}
			
			var formtoggle = $this.attr("form-toggle");
			
			if (formtoggle == "modal") {
				window.dynaform.modal(formtarget, rowid);
				
			// } else if (formtoggle == "static-top" && window.top.inPaaS) {
				// window.top.inPaaS.menu.open(formtarget, rowid);
				
			} else {
				window.dynaform.load(formtarget, rowid);
				
			}
			
			
		});

		this.on("click", "button[role=new]", function(e) {
			var $this = $(this);
			
			var formtarget = $this.attr("form-target");
			if (formtarget == null) {
				formtarget = e.delegateTarget.getAttribute("form-key").replace(".list", ".edit");
			}
			
			window.dynaform.load(formtarget, "");
		});
		
		this.on("click", "button[role=table-new]", function(e) {
			var target = $(this).attr("data-target");
			
			var $tr = $("<tr></tr>");
			var html = $(target).find("thead tr").html().replace(/<th\s/g, "<td ").replace(/<\/th/g, "</td");
			
			$tr.append(html);
			$tr.find("td").contents().filter(function(){
			    return (this.nodeType == 3);
			}).remove();
			
			$tr.find("input").removeAttr("disabled");
			
			$(target).find("tbody").append($tr);
			
		});

		this.on("click", "button[role=cancel]", function(e) {
			e.preventDefault();
			
			if ($(e.delegateTarget).is(".modal *")) {
				$(this).loading();
				$(e.delegateTarget).closest(".modal").modal("hide");
				
			} else {
				var formTarget = $(this).attr("form-target");
				if(formTarget) {
					$(this).loading();
					window.dynaform.load(formTarget, "");
				}

			}
			
			return false;
		});
		
		this.on("click", "button[role=navigate]", function(e) {
			e.preventDefault();
			
			var formTarget = $(this).attr("form-target");
			if(formTarget) {
				$(this).loading();
				window.dynaform.load(formTarget, "");
			}
			
			return false;
		});
		
		this.on("click", "button[role=save]", function(e) {
			$(this).loading();
			return window.dynaform.save(e.delegateTarget, {
				element : $(this)
			});
		});
		
		this.on("change", "input,textarea,select", function(e) {
		
			var o = $(e.delegateTarget).data("js-postdata");
			o[this.name] = this.value;
			
			$(e.delegateTarget).data("js-postdata", o);			
		});
		
		this.on("aftersave", function(e, args) {
			if (args.data.error==null) {
				if ($(e.delegateTarget).is(".modal *")) {
					$(e.delegateTarget).closest(".modal").modal("hide");
				} else {
					if(args.element) {
						var formTarget = args.element.attr("form-target");
						if(formTarget) {
							/*
							 * Save & Navigate 
							 */
							window.dynaform.load(formTarget, "");
						} else {
							/*
							 * Save & Stay
							 */
							var $recordId = $(e.delegateTarget).find("input[record-id]");
							if($recordId && !$recordId.val()) {
								var generatedId = args.data["record-id"];
								$recordId.val(generatedId);
								
								// Update form action with row-id
								var formAction = $(e.delegateTarget).attr("action");
								$(e.delegateTarget).attr("action", formAction + generatedId);
								
								// Push record-id to window history
								window.history.pushState({ savestay:true }, window.document.title, location.href + generatedId);
							}
							
							args.element.loading("done");
						}
					}
				}
			} else {
				if(args.element) {
					args.element.loading("done");
				}
			}
		});
		
		this.on("click", "button[role=duplicate]", function(e) {
			return window.dynaform.duplicate(e.delegateTarget);
		});

		this.on("click", "button[role=remove]", function(e) {
			var $target = $(e.delegateTarget);
			
			/*
			 * Check operation permission for current execution
			 * TODO: Find a way to put it on 'dynaform.remove'. The problem is that it could break some code.
			 */
			if(!$target.is("[data-permission-delete]")) return false;
			
			var rowid = $target.find("[record-id]").val();
			var fkey = $target.attr("form-key");

			if( $(this).is("tr[row-id] button") ) {
				rowid = $(this).closest("tr[row-id]").attr("row-id");
			}
			
			var $btn = $(this);
			
			var title = this.title || this.getAttribute("data-original-title") || document.title
			
			dynaform.confirm( title, "Deseja remover o registro?", function() {
				$btn.loading();
				dynaform.remove(fkey, rowid, function(data, textStatus, jqXHR) {
					$target.trigger("afterremove", {
						data    : data,
						element : $btn
					});
				});
			})
		});
		
		this.on("afterremove", function(e, args) {
			if (args.data.error==null) {
				if ($(e.delegateTarget).is(".modal *")) {
					$(e.delegateTarget).closest(".modal").modal("hide");
				} else {
					if(args.element) {
						var formTarget = args.element.attr("form-target");
						if(formTarget) {
							window.dynaform.load(formTarget, "");
						} else {
							if ($.fn.DataTable) {
								var $row = $(args.element).closest("tr");
								
								var dt = $(args.element).closest("table").DataTable();
								dt.row( $(args.element).closest("tr") ).remove().draw();
								
							} else {
								if(args.element.parents("tr[row-id]").length > 0)
									args.element.tooltip("destroy").closest("tr").remove();
								else
									args.element.loading("done");
							}
						}
					}
				}
			} else {
				if(args.element) {
					args.element.loading("done");
				}
			}
		});
		
		this.on("click", "button[role=dom-remove]", function(e) {
			var $el = $(this).tooltip("destroy").closest("tr")
			
			dynaform.confirm(document.title, "Deseja remover o registro?", function() {
				$el.remove();
			})
			
		});
		
		this.on("click", "[role=filter][data-target]", function(e) {
			var $this = $(this);
			$this.loading();
			
			var dataTarget = $(e.currentTarget).attr('data-target');
			dynaform.filter($('#' + dataTarget), {
				oncomplete: function() {
					$this.loading("done");
				}
			});
			
			/* ga-code (dynaform-filter) */
			var fkey = e.delegateTarget.getAttribute("form-key");
			
			ga('send', 'event', 'dynaform', 'filter', { "form": fkey });

		});
		
		this.on("keyup", "[role=filter-field][data-target]", function(e) {
			if (e.which==13) {
				var dataTarget = $(e.currentTarget).attr('data-target');
				dynaform.filter($('#' + dataTarget));
				
				/* ga-code (dynaform-filter) */
				var fkey = e.delegateTarget.getAttribute("form-key");
				
				ga('send', 'event', 'dynaform', 'filter', { "form": fkey });
			}
		});
		
		var $dependform = this;
		this.find("[depends]").each(function(index, el) {
			var depends = el.getAttribute("depends").split(",");
			var dependantId = el.getAttribute("form-field-id");
			
			for (var k in depends) {
				$dependform.on("change", "[form-field-id=" + depends[k] + "]", function(e) {
					var $source = $(this);
					var $target = $("[form-field-id=" + dependantId + "]");
					
					$source.trigger("beforedepends", [ $target ]);
					
					//console.log($target);
					dynaform.filter($target);
				});
			}
		});
		
		this.on("keydown", "input:not(.bootstrap-tagsinput input)", function(e) {
			if (e.which==13) return false;
		})
		
		this.find("[form-field-id]").trigger("load");
		
	}
	
	$.fn.save = function() {
		
	}
	
	$.fn.getFormData = function() {
		var jd = this.serializeArray().concat(this.find("input[type=checkbox]:not(:checked):not(:disabled)").map(function() { return { "name": this.name, "value": this.value=="Y" ? "N" : "" }}).get());

		$("select[multiple]:not(:disabled)").each(function(index, el) {
			if($(el).val()==null) {
				jd = jd.concat({ "name": el.name, "value": "" });
			}
		});
		
		this.find("input[data-type=file-upload]").each(function(index, el) {
			/*jd.concat({ "name": el.name, "value":  })
			
	      	formData.append("storage", storageId);
	      	formData.append("f" + uploadId, el);
	      	*/

		});
		
		debugger;
		
		return jd;
	}
	
	$.fn.dynaform.defaults = {

		optionsValidate: {
	     	ignore         : '',
			invalidHandler : function(e, validator){
	           if(validator.errorList.length)  
	              $('#tabs a[href="#' + $(validator.errorList[0].element).closest(".tab-pane").attr('id') + '"]').tab('show');
	           
	        },

	        errorPlacement: function (error, element) {
	        	
	        	var notification = $(element).attr("data-notification-target");

	        	if(notification){
	        		error.appendTo(notification);
	        	} else {
	        		$(element).after(error);
	        	}
	        }

		},
		callbackSave: function(e) { 
			
		},
		callbackDelete: function(e) { 
			
		},
		htmlConfirm: '<div class="dynaform-modal modal fade"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title"></h4></div><div class="modal-body"><p></p></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Cancelar</button><button type="button" class="btn btn-primary">Confirmar</button></div></div></div></div>',
		htmlAlert:   '<div class="dynaform-modal modal fade"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button><h4 class="modal-title"></h4></div><div class="modal-body"><p></p></div><div class="modal-footer" style="text-align: center;"><button type="button" class="btn btn-primary">Ok</button></div></div></div></div>'
	};

})(jQuery);

/* fix for notify */
// try {
// 	if (window.top.jQuery.notify) $.notify = window.top.jQuery.notify;
// } catch(e) {}

/* debounce */
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait); 
        if (callNow) func.apply(context, args);
    };
};

/*
 * LocalStorageFactory
 * enables the use of JSON objects in the localStorage
 * 
 * https://gist.github.com/joaovarandas/3c82aaf051b576d59dbec4afe454f533
 * @author jvarandas
 */
// (function(global) {
//     var _cache = {}, _ls = {};
  
//     var ls;
//     if (typeof localStorage === 'undefined') {       
//         ls = {
//             setItem: function(key, value) {
//               _ls[key] = value;
//             },
//             getItem: function(key) {
//               return _ls[key];
//             }            
//         }
//     } else {
//         ls = localStorage;
//     }

//     function fnAppender(key, value) {
//         this.data[key] = value;    

//         return this.data;
//     }

//     function fnSetter() {
//         ls.setItem(this.key, JSON.stringify(this.data));
//     }
  
//     function fnFactory(key) {

//       if (_cache[key]) 
//         return _cache[key];

//       /* multi-thread issue */
//       var jsonString = ls.getItem(key);
//       _cache[key] = jsonString ? JSON.parse(jsonString) : {};
//       var o = _cache[key];
//       /* end of multi-thread issue */

//       var g = {
//         "key": key,
//         "data": o
//       };
//       o["set"] = fnSetter.bind(g);
//       o["append"] = fnAppender.bind(g);

//       return o;
//     }

//     global["LocalStorageFactory"] = fnFactory;

// })(this);

/* startup */
(function($, global, undefined) { 
	function fn_page_load() {
		try {
			var $form = $("form");
			
			if (global.dynaform !== undefined && $form.length > 0) 
				global.dynaform.init($form); 
				
			// if (window.top && window.top.inPaaS) 					
				// window.top.inPaaS.iframeload( $form.attr("form-key"), $form.find("[record-id]").val() );
		} catch(e) {
			
		}

	}
	
	$(document).ready(fn_page_load);
	
})(jQuery, this);


/**
 * inPaaS AngularJS Helper
 *
 * @author jvarandas
 */
(function(global) {
	'use strict';
  	
  	if (typeof(angular) === 'undefined') return;
	
    /*
     *
     */
    var require = global.ngRequire = function(id, $scope, global) { 
        if (typeof arguments[0] !== 'string') throw 'USAGE: require(formKey)';
         
        var moduleContent = '';
        
		if (require._cache[id]) {
			return require._cache[id];
        }
      
		$.get({ "url": "/includes/" + id + "/js/" + id + ".js", "dataType": "text" }, function(moduleContent) {          	
         	try {
           		var f = new Function('require', 'module', '$scope', moduleContent);
 
            	require._root.unshift(id);
            	var exports = f.call(global || {}, require, { "id": id }, $scope);
            	require._root.shift();
              
			} catch(e) {
				throw 'Unable to require source code from "' + id + '": ' + e;
            
          	}
			
            require._cache[id] = exports;
          
          	if (typeof(cb) == "function") cb(exports);
        });      
    }
    
    require._root = [''];
  	require._cache = {};  
  
  	var prepare = global.ngPrepare = function() {
      	document.body.setAttribute("data-ng-app", "dynaform");
      	document.body.setAttribute("data-ng-controller", "DynaFormController as formController");      
      	document.body.setAttribute("data-ng-class", "{ 'ready': formController.isReady() }");
    }
	
  	/*
	 * ngController
	 */
	var controller = global.ngController = function(ctrl) {
      	global.ngPrepare();
      
		var ngDynaForm = angular.module('dynaform', []);
		
		ngDynaForm.config(['$httpProvider', function($httpProvider) {
		    $httpProvider.defaults.headers.common['X-Requested-With'] = 'ngRequire';
		}]);
		
      	
      	// add ready/load-wait functionality
      	ctrl.prototype.setReady = function(ready) {
          	this.ready = ready;
        }
        
      	ctrl.prototype.isReady = function() {
          	return this.ready || false;
        }
        
        // ctrl.setReady(false);

        
		ngDynaForm.directive('inpaasFormInclude', function() {
			var contentUrl;

			return {
				restrict : "E",
				scope : false,
				replace : true,
				link : function($scope, element, attrs) {
                  	var formId = attrs["formId"];
					var ctrlProto = Object.getPrototypeOf($scope.formController);
                  	dynaform.ngRequire(formId, $scope, ctrlProto);

                  	// add the css to head
                    var ssref=document.createElement("link");
                    ssref.setAttribute("rel", "stylesheet")
                    ssref.setAttribute("type", "text/css")
                    ssref.setAttribute("href", "/includes/" + formId + "/css/" + formId + ".css")

                    if (typeof(ssref)!="undefined")
                        document.getElementsByTagName("head")[0].appendChild(ssref)
                  
                },
				templateUrl : function(elem, attrs) {
					return '/forms/' + attrs["formId"];

				}
			}
		})

		ngDynaForm.controller("DynaFormController", [ '$scope', ctrl ]);
      	
	}  
  
})(dynaform);




