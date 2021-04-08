define([
    'jquery',
    'require',
    './commentapi', 
    './authorization',
    './annotation_dependencies/dateformat',
    './annotation_dependencies/jquery.qtip'
], function ($, require, commentapi, authorization, dateformat, qtip) {

    "use strict";

    var flag_name = 'comment';
    var counter = 0;
    var is_edited_comment_mode = false;

    var ERROR_MESSAGE = "Please log in before editing or submitting comments.";

    IPython.notebook.metadata["colors"] = ['#424a70', '#e04646', '#46b38e', '#a64c6c', '#e89851', '#b5f26b', '#d9577c', '#497791', '#332431', '#784465', '#303042', '#e8cb58', '#466287', '#3ae056', '#8f476a'];

    function generate_id() {
        return 'comment_dialog_' + counter++;
    };

    var load_css = function (name) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = require.toUrl(name);
        document.getElementsByTagName("head")[0].appendChild(link);
    };

    load_css('./annotation_extension.css');

    var button_ui_generator = function(name, setter, getter){
        return function(div, cell, celltoolbar) {
            var button_container = $(div);
            var btn = $('<button/>')
                .append(
                    $("<i/>").addClass('fa fa-comment-o')
                );
            btn.addClass("btn btn-default btn-xs");
            btn.click(function(){
                        var v = getter(cell);
                        setter(cell, !v);
            });
            button_container.append($('<span/>').append(btn));
        };
    };

    function doGetCaretPosition (ctrl) {
        $(ctrl).focus();
        var CaretPos = 0;	// IE Support
        if (document.selection) {
            ctrl.focus ();
            var Sel = document.selection.createRange ();
            Sel.moveStart ('character', -ctrl.value.length);
            CaretPos = Sel.text.length;
        }
        // Firefox support
        else if (ctrl.selectionStart || ctrl.selectionStart == '0')
            CaretPos = ctrl.selectionStart;
        return (CaretPos);
    }

    function setCaretPosition(ctrl, pos){
        if(ctrl.setSelectionRange)
        {
            //ctrl.focus();
            ctrl.setSelectionRange(pos,pos);
        }
        else if (ctrl.createTextRange) {
            var range = ctrl.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    }

    function new_comment_element(cell) {
        var comment_id = generate_id();
        cell.comment_id = comment_id;
        var $dialog = $('<div/>', {id: comment_id, title: 'Comment'});
        var $comment_box = $('<div/>', {class: 'comment_box'});
        var $printed_comments = $('<div/>',{class: 'printed_comments'});
        var $textarea = $('<textarea/>', {type: 'text', class: 'edited_comment'});
        $textarea.attr("index", -1);
        var $button = $('<button/>', {class: 'resolve_comment', html:'Resolve', title: 'Resolve'});
        append_old_comments(cell, $printed_comments);
        $printed_comments.appendTo($comment_box);
        $textarea.appendTo($comment_box);
        $comment_box.appendTo($dialog);
        $button.appendTo($dialog);
        return $dialog;
    }

    function format_date_to_today_moment(date) {
        if (date == undefined)
            return "unknown time";
        date = new Date(date);
        var now = new Date();
        if ((date.getYear() == now.getYear()) && (date.getMonth() == now.getMonth()) && (date.getDay() == now.getDay()))
            return dateformat.dateFormat(date, "HH:MM");
        else
            return dateformat.dateFormat(date, "dd.mm.yy");
    }

    function insert_line_breaks(val) {
        return val.replace(/\r\n|\r|\n/g, "<br>");
    }

    function design_comment(cell, comment, index) {
        var date = format_date_to_today_moment(comment.date);
        var $comment_field = $('<div/>', {class: 'comment_field'});
        var commenter_number = IPython.notebook.metadata["commenters"].indexOf(comment.username.toLowerCase().trim());
        var colors = IPython.notebook.metadata["colors"];
        var color = '';
        if (commenter_number > colors.length - 1) {
            colors.push('#'+Math.floor(Math.random()*16777215).toString(16));
        } 
        if (commenter_number == -1) {
            color = '#285589'
        } else {
            color = colors[commenter_number];
        }
        var $username = $('<span/>', {class: 'comment_username', html: comment.username + ":", style: "color: " + color + ";"});
        var $date = $('<span/>', {class: 'comment_date', html: date});
        var $heading = $('<h4/>', {class: 'comment_heading'});
        var $comment = $('<p/>', {html: insert_line_breaks(comment.comment), class: "comment_text"});
        $username.appendTo($heading);
        $date.appendTo($heading);
        $heading.appendTo($comment_field);
        $comment.appendTo($comment_field);
        $comment_field.attr("index", index);
        $comment_field.attr("username", comment.username);
        $comment_field.attr("date", comment.date);
        $comment_field.dblclick(function() {
            var $textarea = $('#' + cell.comment_id + ' .edited_comment');
            if (!authorization.is_authorized()) {
                $textarea.val(ERROR_MESSAGE).css('color','red');
                $textarea.blur();
            } else {
                if ($textarea.val() == ERROR_MESSAGE) {
                    $textarea.val("");
                }
                set_edit_comment_mode($(this));
            }
        });
        return $comment_field;
    }

    function set_edit_comment_mode($comment_field) {
        if(is_edited_comment_mode)
            return;
        is_edited_comment_mode = true;
        var ind = $comment_field.attr("index");
        var $previous_comment = $comment_field.find(".comment_text");
        $previous_comment.hide();
        var edited_text = $previous_comment.html().replace(/<br>/g,"\n");
        var $edited_comment  = $("<textarea/>", {html:edited_text, class: "edited_comment"});
        $edited_comment.attr("index", ind);
        $edited_comment.appendTo($comment_field);
    }

    function append_old_comments(cell, $printed_comments) {
        $printed_comments.attr("comment_num", 0);
        var old_comments = commentapi.get_all_comments(cell);
        if (!old_comments)
            return;
        for (var i = 0; i < old_comments.length; ++i) {
            var comment = old_comments[i];
            var $comment = design_comment(cell, comment, i);
            $printed_comments.append($comment);
            $printed_comments.attr("comment_num", i + 1);
        }
    }

    function new_comment_qtip_options(cell, $dialog) {
        return {
            content: {
                text: $dialog,
                title: 'Comment',
                button: 'Close'
            },
            style: {
                classes: 'qtip-bootstrap ctb_hideshow'
            },
            hide: false,
            position: {
                my: 'top right',
                at: 'top right',
                container: cell.element
            },
            show: {
                ready: true,
                event: false
            }
        };
    }

    function add_new_comment_events(cell) {
        $('body').on('keydown', '#' + cell.comment_id + ' .edited_comment', function (keypressed) {
            if (keypressed.keyCode == 13) {
                if (keypressed.altKey) {
                    add_new_line(this);
                } else {
                    if ($(this).attr("index") >= 0) {
                        save_edited_comment($(this), cell);
                    }
                    else {
                        print_last_comment(cell);
                    }
                }
                $(this).parents('form').submit();
                return false;
            }
        });
        $('body').on('click', '#' + cell.comment_id + ' .edited_comment', function () {
            IPython.keyboard_manager.edit_mode();
            if (!authorization.is_authorized()) {
                $("#username_input_field").css("background-color", "#FFCCCC");
                $(this).val(ERROR_MESSAGE).css('color','red');
                $(this).blur();
            } else {
                if ($(this).val() == ERROR_MESSAGE) {
                    $(this).val("");
                }
                $(this).css('color','black');
                if ($(this).attr("index") == -1)
                    scroll_to_last_comment($('#' + cell.comment_id + ' .printed_comments'));
            }
        });
        $('body').on('click', '#' + cell.comment_id + ' .resolve_comment', function () {
            var $comments = $('#' + cell.comment_id + ' .printed_comments').children('.comment_field');
            for (var i = 0; i < $comments.length; i++){
                $comments[i].remove();
            }
            cell.metadata.comments = [];
            IPython.notebook.save_checkpoint();
            hide_comment_dialog(cell);
        });
    }

    function add_new_line(edited_comment) {
        var cursorPosition = $(edited_comment).prop("selectionStart");
        var val = $(edited_comment).val();
        val = val.substr(0, cursorPosition) + "\n" + val.substr(cursorPosition);
        var cur_pos = doGetCaretPosition(edited_comment);
        $(edited_comment).val(val);
        setCaretPosition(edited_comment, cur_pos + 1);
        var psconsole = $(edited_comment);
        if(psconsole.length)
            psconsole.scrollTop(psconsole[0].scrollHeight - psconsole.height());
    }

    function send_comment_dialog(cell) {
        var $dialog = new_comment_element(cell);
        cell.element.qtip(new_comment_qtip_options(cell, $dialog));
        add_new_comment_events(cell);
    }

    function scroll_to_last_comment($printed_comments) {
        var scrollHeight  = $printed_comments[0].scrollHeight;
        $printed_comments.scrollTop(scrollHeight);
    }

    function delete_comment($printed_comments, $comment_field, cell) {
        var comment_num = +$printed_comments.attr("comment_num");
        $printed_comments.attr("comment_num", comment_num - 1);
        var $other_comments = $comment_field.siblings();
        $comment_field.remove();
        var index = +$comment_field.attr("index");
        for (var i = index; i < $other_comments.length; ++i) {
            $($other_comments[i]).attr("index", i);
        }
        commentapi.delete_comment(cell, index);
    }

    function save_edited_comment($edited_comment, cell) {
        var text = insert_line_breaks($edited_comment.val());
        var index = $edited_comment.attr("index");
        var $comment_box = $edited_comment.parents(".comment_box");
        var $comment_field = $comment_box.find(".comment_field[index=" + index + "]");
        var $comment_text = $comment_field.find(".comment_text");
        if (text.length) {
            $comment_text.html(text);
            var date = new Date();
            commentapi.save_edited_comment(cell, +$comment_field.attr("index"), text, date);
            $comment_text.show();
            $comment_field.find(".comment_date").html("edited: " + format_date_to_today_moment(date));
            $comment_field.attr("date", date);
        }
        else {
            delete_comment($comment_box.find(".printed_comments"), $comment_field, cell);
        }
        $edited_comment.remove();
        is_edited_comment_mode = false;
    }

    function print_last_comment(cell) {
        var $last_comment = $('#' + cell.comment_id + ' .edited_comment');
        var text = $last_comment.val();
        if (!text.length) {
            return;
        }
        var username = authorization.get_username();
        var comment = commentapi.save_comment(cell, username, text);
        var $printed_comments = $('#' + cell.comment_id + ' .printed_comments');
        var comment_index = + $printed_comments.attr("comment_num");
        var $saved_comment = design_comment(cell, comment, comment_index);
        $saved_comment.appendTo($printed_comments);
        $last_comment.val("");
        $printed_comments.attr("comment_num", comment_index + 1);
        scroll_to_last_comment($printed_comments);
        $("#" + cell.comment_id + " .edited_comment").blur();
        
    }

    function show_comment_dialog(cell) {
        if (cell.comment_id == undefined) {
            send_comment_dialog(cell);
        } else {
            cell.element.qtip("show");
        }
    }

    function hide_comment_dialog(cell) {
        if (cell.comment_id != undefined) {
            cell.element.qtip("hide");
        }
    }

    var cell_flag_init = button_ui_generator(
        flag_name,
        function (cell, value) {
            cell.metadata[flag_name] = value;
            if (value) {
                show_comment_dialog(cell);
            } else {
                hide_comment_dialog(cell);
            }
        },
        function (cell) {
            hide_comment_dialog(cell);
        }
    );

    // Annotation widget block
    var show_annotation_widget = function() {
        /*
         Append annotation widget to maintoolbar.
         Widget includes button which shows all nonempty comments and so called 'username widget'.
        */
        var btn_group = $('<div/>').addClass("btn-group").attr('id', 'annotation_widget');
        var show_comments_button = $('<button/>').append($("<i/>").addClass('fa fa-comments'));
        show_comments_button.addClass("btn btn-default");
        show_comments_button.attr('id', 'show_comments_button');
        show_comments_button.attr('title', 'show or hide comments');
        btn_group.append(show_comments_button);

        var space = $('<span/>').addClass("navbar-text").text(" ");
        btn_group.append(space);

        show_comments_button.click(
            function() {
                IPython.CellToolbar.activate_preset('Enable Comments');
                var cells = IPython.notebook.get_cells();
                if ($('.qtip:visible').length < 2) {
                    for (var i in cells) {
                        if (cells[i].metadata['comments'] != undefined && cells[i].metadata['comments'].length > 0) {
                            show_comment_dialog(cells[i]);
                        }
                    }
                } else {
                    for (var i in cells) {
                        hide_comment_dialog(cells[i]);
                    }
                }
            }
        );
        $("#maintoolbar-container").append(btn_group);
    }

    show_annotation_widget();
    if (authorization.is_authorized()) {
        var username = authorization.get_username();
        authorization.show_user_widget(username);
    } else {
        authorization.show_user_login_widget();
    }

    IPython.CellToolbar.register_callback(flag_name, cell_flag_init);
    IPython.CellToolbar.register_preset('Enable Comments', [flag_name]);
});
