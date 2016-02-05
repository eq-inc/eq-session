/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/*jslint node: true */
'use strict';



// Variables
const mongoose = require('mongoose');



// Export session store schema
module.exports = {
    token: {
        type: String,
        required: true,
        unique: true
    },
    ticket: {
        type: String,
        required: true
    }
};



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
