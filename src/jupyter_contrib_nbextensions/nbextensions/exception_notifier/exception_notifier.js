define([
  'require',
  'jquery',
  'moment',
  'base/js/namespace',
  'base/js/events',
  'notebook/js/codecell',
  'notebook/js/outputarea',
  'services/config',
  ], function (
    requirejs,
    $,
    moment,
    Jupyter,
    events,
    outputarea,
    codecell) {
    
    "use strict";
  
    var CodeCell = codecell.CodeCell;

    var params = {
      sticky: true,
      play_sound: true
    };
    var audio_file = "./notify.mp3";
  
    var current_time = function() {
      return new Date().getTime() / 1000;
    };
  
    var play_notification_sound = function(opts) {
      try {
        var audio = new Audio(requirejs.toUrl(audio_file));
        audio.play();
      } catch(e) {
        console.log('HTML5 Audio not supported in browser.');
      }
    };
  
    var notify = function () {
        var opts = {
          body: "Exception",
          icon: Jupyter.notebook.base_url + "static/base/images/favicon.ico",
          requireInteraction: params.sticky
        };
        if (params.play_sound) {
          play_notification_sound(opts);
        }
    };
  
    function showNotification(evalue) {
      notify();
      const notification = new Notification("Exception Occurred", {
        body: evalue,
        icon: "https://www.iconfinder.com/data/icons/miscellaneous-67-mix/168/objection_convulsions_exception_slander_exclusion_denigration_mudslinging-512.png"
     });
    }
    function checkPermission() {
      if (Notification.permission === "granted") {
      events.on('execute.CodeCell', function(evt, data) {
        var outputs = data.cell.output_area.outputs;
        setTimeout(function() { 
          if ("traceback" in outputs[0]) {
              showNotification(data.cell.output_area.outputs[0].evalue);
          }
        }, 1000);
      });
     } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            showNotification();
          }
           console.log(permission);
        });
     }
    }
    var load_ipython_extension = function () {
      return Jupyter.notebook.config.loaded.then(function() {
        $.extend(true, params, Jupyter.notebook.config.data.notify);
        checkPermission();
      });
    };
  
    return {
      load_ipython_extension : load_ipython_extension
    };
  
  });