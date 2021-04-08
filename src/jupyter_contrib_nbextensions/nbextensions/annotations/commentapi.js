define(['jquery', './authorization'], function($, authorization) {

    "use strict";

    var save_comment = function(cell, username, comment) {
        var item = {"username": username, "comment": comment, "date": new Date()};
        if (cell.metadata['comments'] == undefined) {
            cell.metadata['comments'] = [item];
        } else {
            cell.metadata['comments'].push(item);
        }
        IPython.notebook.save_checkpoint();
        console.log("Comment saved");
        return item;
    };

    var save_edited_comment = function(cell, index, edited_comment, date) {
        cell.metadata.comments[index].comment = edited_comment;
        cell.metadata.comments[index].date = date;
        IPython.notebook.save_checkpoint();
    };

    var delete_comment = function(cell, index) {
        cell.metadata.comments.splice(index, 1);
        IPython.notebook.save_checkpoint();
    };

    var get_all_comments = function(cell) {
        if (cell != null) {
            return cell.metadata.comments;
        } else {
            throw new Error("Invalid cell");
        }
    };

    var commentapi = {
        save_comment : save_comment,
        save_edited_comment : save_edited_comment,
        get_all_comments : get_all_comments,
        delete_comment : delete_comment
    };

    return commentapi;
});
