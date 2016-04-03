var file_text = function( files, repo ) {
    var text = "```";
    files.forEach( function( file ) {
        text += '<' + repo.html_url + '/blob/master/' + file + '|' + file + ">\n";
    } );

    text += "```";

    return text;
};

var files_attachment = function( files, verb, repo ) {
    var colors = { 'added': '#00ff00', 'removed': '#ff0000', 'modified': '#ffff66' };
    var attachment = {
        'fallback'  : 'files were ' + verb + ' in this push.',
        'color'     : colors[ verb ],
        'title'     : 'Files ' + verb,
        'mrkdwn_in' : [ 'text' ],
        'text'      : file_text( files, repo )
    };

    return attachment;
};

module.exports = {
    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var before    = step.input( 'before' ).first()
          , after     = step.input( 'after' ).first()
          , compare   = step.input( 'compare' ).first()
          , commits   = step.input( 'commits' ).toArray()
          , repo      = step.input( 'repository' ).first()
          , sender    = step.input( 'sender' ).first()
        ;

        var files    = { 'added': { }, 'removed': { }, 'modified': { } };

        var commit_text = "```\n";
        commits.forEach( function( commit ) {
            var msg = commit.message;
            msg = msg.length > 57 ? msg.substr( 0, 57 ) + '...' : msg.substr( 0, 60 );
            commit_text += '<' + commit.url + '|' + commit.id.substr( 0, 9 ) + ' ' + msg + ">\n";

            commit.added.forEach(    function( file ) { files.added[ file ]    = true; } );
            commit.removed.forEach(  function( file ) { files.removed[ file ]  = true; } );
            commit.modified.forEach( function( file ) { files.modified[ file ] = true; } );

        } );

        commit_text += '```';

        var message = {
            "text": '<' + sender.html_url + '|@' + sender.login + '> pushed ' + commits.length + ' commits to <' + repo.html_url + '|' + repo.full_name + '>',
            "attachments": [ {
                'fallback': '@' + sender.login + ' pushed ' + commits.length + ' commits to ' + repo.full_name,
                'color': '#00ffff',
                'author_name': '@' + sender.login,
                'author_link': sender.html_url,
                'author_icon': sender.avatar_url,
                'title': 'View changes',
                'title_link': compare,
                'text': commit_text,
                "mrkdwn_in": [ 'text' ]
            } ]
        };

        /* TODO: link to files on the correct branches */
        if ( Object.keys( files.added ).length > 0 ) {
            message.attachments.push( files_attachment( Object.keys( files.added ).sort(), 'added', repo ) );
        }

        if ( Object.keys( files.removed ).length > 0 ) {
            message.attachments.push( files_attachment( Object.keys( files.removed ).sort(), 'removed', repo ) );
        }

        if ( Object.keys( files.modified ).length > 0 ) {
            message.attachments.push( files_attachment( Object.keys( files.modified ).sort(), 'modified', repo ) );
        }

        this.complete( message );
    }
};
