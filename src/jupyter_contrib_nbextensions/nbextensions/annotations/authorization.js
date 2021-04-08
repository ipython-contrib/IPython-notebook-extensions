define(['jquery'], function($) {

    "use strict";

    var SHORT_NAME_ERROR = "This name is too short";
    
    var getCookie = function(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length == 2) {
            return parts.pop().split(";").shift();
        }
    };

    var authorize = function(username) {
        delete_cookie();
        if (username.length <= 1) {
            throw new Error(SHORT_NAME_ERROR);
        }
        document.cookie = 'username=' + username;
        document.cookie = 'registration_date=' + Date();
        IPython.notebook.save_checkpoint();
        console.log("Authorized");
    };

    var show_user_widget = function(username) {
        var btn_group = $("#annotation_widget");
        var username_field = $('<span/>').addClass("navbar-text").text(username + " ");
        username_field.attr('id', 'username_field');
        username_field.attr('title', 'click to edit');
        username_field.click(
            function() {
                remove_user_widget();
                delete_cookie();
                show_user_login_widget(username);
            }
        );
        var icon = $("<i/>").addClass('fa fa-user');
        icon.attr('id', 'user_icon');
        btn_group.append(username_field);
        btn_group.append(icon);
    };

    var remove_user_widget = function() {
        $("#username_field").remove();
        $("#user_icon").remove();
    }

    var show_user_login_widget = function (username) {
        if (username == undefined) {
            username = "";
        }
        var btn_group = $("#annotation_widget");
        var username_input_field = $('<input>');
        username_input_field.attr('id', 'username_input_field');
        username_input_field.val(username);
        username_input_field.attr({'size':'17', 'placeholder':' Type your name'});
        username_input_field.attr('title', 'username');
        username_input_field.addClass("btn btn-default");
        username_input_field.click(function () {
            $("#username_input_field").css('color','black');
            $("#username_input_field").css("background-color", "white");
            if($("#username_input_field").val() === SHORT_NAME_ERROR) {
                $("#username_input_field").val("");
            }
            IPython.keyboard_manager.edit_mode();
        });
        var submit_button = $('<button/>').append($("<i/>").addClass('fa fa-user-plus'));
        submit_button.addClass("btn btn-default");
        submit_button.attr('id', 'submit_button');
        submit_button.attr('title', 'save name');
        btn_group.append(username_input_field);
        btn_group.append(submit_button);
        submit_button.click(
            function() {
                var username = $("#username_input_field").val();
                try {
                    authorize(username);
                    if (is_authorized()) {
                        remove_user_login_widget();
                        show_user_widget(username);
                        save_commenter(username);
                    }
                } catch(e) {
                    $("#username_input_field").val(e.message).css('color','red');
                    $("#username_input_field").blur();
                }
            }
        );
        username_input_field.keyup(function(e){
                var code = (e.keyCode ? e.keyCode : e.which);
                if(code == 13) {
                    var username = $("#username_input_field").val();
                    try {
                        authorize(username);
                        if (is_authorized()) {
                            remove_user_login_widget();
                            show_user_widget(username);
                            save_commenter(username);
                        }
                    } catch(e) {
                        $("#username_input_field").val(e.message).css('color','red');
                        $("#username_input_field").blur();
                    }
                }
            }
        );
    };

    var remove_user_login_widget = function() {
        $("#username_input_field").remove();
        $("#submit_button").remove();
    }

    var is_authorized = function() {
        // Returns true if cookie contains user info
        if (getCookie('username') == undefined || getCookie('username') == '') {
            return false;
        } else {
            return true;
        }
    };

    var get_username = function() {
        return getCookie("username");
    };

    var delete_cookie = function() {
        document.cookie = 'username=';
    }

    var save_commenter = function(username) {
        var formatted_username = username.toLowerCase().trim();
        if (IPython.notebook.metadata["commenters"] == undefined) {
            IPython.notebook.metadata["commenters"] = [];
        }
        if (IPython.notebook.metadata["commenters"].indexOf(formatted_username) == -1) {
            IPython.notebook.metadata["commenters"].push(formatted_username);
            IPython.notebook.save_checkpoint();
        } else {
            console.log('User already saved as commenter.');
        }
    }

    var authorization = {
        authorize : authorize,
        is_authorized : is_authorized,
        get_username : get_username,
        show_user_widget : show_user_widget,
        show_user_login_widget : show_user_login_widget,
        save_commenter : save_commenter
    };

    return authorization;
});
