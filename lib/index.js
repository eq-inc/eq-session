/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/*jslint node: true */
'use strict';



// Variables
const crypto = require('crypto'),
    co = require('co'),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    nums = 'ABCDEFGHIJKLMNOPQRSTUVXWYZabcdefghijklmnopqrstuvwxyz0123456789';


/**
 * EqSession
 *
 * @class
 */
class EqSession {
    /**
     * Constructor
     *
     * @constructs EqSession
     * @param      {Object} connection
     * @param      {Object} config
     */
    constructor(connection, config) {
        const self = this;
        self.connection = connection;
        self.config = config || {};
        self.ttl = self.config.expire || 60 * 60 * 24 * 30;
        self.models = {};

        self.initialize();
    }

    /**
     * Initialize instance
     */
    initialize() {
        const self = this,
            store_collection = self.config.store_collection || 'session_store',
            ticket_collection = self.config.ticket_collection || 'session_ticket',
            token_collection = self.config.token_collection || 'session_token',
            options = {
                timestamps: {
                    createdAt: 'created_at',
                    updatedAt: 'updated_at'
                }
            };

        // Session store
        try {
            self.models.store = self.connection.model(store_collection);
        } catch (e) {
            if ('MissingSchemaError' === e.name) {
                const store_schema = new mongoose.Schema(require('./schema/store'), options);
                self.models.store = self.connection.model(store_collection, store_schema);
            } else {
                throw e;
            }
        }

        // Session ticket
        try {
            self.models.ticket = self.connection.model(ticket_collection);
        } catch (e) {
            if ('MissingSchemaError' === e.name) {
                const ticket_schema = new mongoose.Schema(require('./schema/ticket'), options);
                ticket_schema.index('updated_at', {index: true}, self.ttl);
                self.models.ticket = self.connection.model(ticket_collection, ticket_schema);
            } else {
                throw e;
            }
        }

        // Session token
        try {
            self.models.token = self.connection.model(token_collection);
        } catch (e) {
            if ('MissingSchemaError' === e.name) {
                const token_schema = new mongoose.Schema(require('./schema/token'), options);
                token_schema.index('updated_at', {index: true}, 300);
                self.models.token = self.connection.model(token_collection, token_schema);
            } else {
                throw e;
            }
        }
    }

    /**
     * Create session ticket
     *
     * @param {string} id
     * @param {Function} callback
     */
    createTicket(id, callback) {
        const self = this;
        co(function* create() {
            const ticket = crypto.randomBytes(32).toString('base64'),
                result = yield self.models.ticket.findOne({ticket: ticket});

            return (result) ? create() : ticket;
        }).then(function (ticket) {
            const data = new self.models.ticket({
                ticket: ticket,
                data: {
                    id: id
                }
            });

            data.save().then(function () {
                callback(null, ticket);
            }).catch(function (error) {
                callback(error);
            });
        }).catch(function (error) {
            callback(error);
        });
    }


    /**
     * Get ID by ticket
     *
     * @param {string} ticket
     * @param {Function} callback
     */
    getId(ticket, callback) {
        const self = this;
        co(function* () {
            const result = yield self.models.ticket.findOne({ticket: ticket}),
                data = (result && result.data) || {};

            return data.id || null;
        }).then(function (id) {
            callback(null, id);
        }).catch(function (error) {
            callback(error);
        });
    }


    /**
     * Store session data
     *
     * @param {string} id
     * @param {*} data
     * @param {Function} callback
     */
    setSession(id, data, callback) {
        const self = this;
        self.models.store.findOneAndUpdate({id: id}, {data: data}, {upsert: true}, callback);
    }


    /**
     * Get session data
     *
     * @param {string} id
     * @param {Array} columns
     * @param {Function} callback
     */
    getSession(id, columns, callback) {
        if (_.isFunction(columns)) {
            callback = columns;
            columns = [];
        }

        const self = this;
        co(function* () {
            const result = yield self.models.store.findOne({id: id}),
                data = _.isObject(result) ? result.data : {};

            return _.isEmpty(columns) ? data : _.pick(data, columns);
        }).then(function (result) {
            callback(null, result);
        }).catch(function (error) {
            callback(error);
        });
    }


    /**
     * Get session data by ticket
     *
     * @param {string} ticket
     * @param {Array} columns
     * @param {Function} callback
     */
    getTicketSession(ticket, columns, callback) {
        if (_.isFunction(columns)) {
            callback = columns;
            columns = [];
        }

        const self = this;
        self.getId(ticket, function (error, id) {
            if (error) {
                return callback(error);
            }

            if (!id) {
                return callback(null, null);
            }

            self.getSession(id, columns, function (error, result) {
                if (error) {
                    return done(error);
                }

                result.id = id;

                callback(null, result);
            });
        });
    }

    /**
     * Create token
     *
     * @param {string} ticket
     * @param {Function} callback
     */
    createToken(ticket, callback) {
        const self = this;
        co(function* () {
            return yield self.models.ticket.findOne({ticket: ticket});
        }).then(function (ticket) {
            if (!ticket) {
                return callback(new Error('Wrong ticket'));
            }

            co(function* create() {
                let token = '';
                for (let i = 0; i < 8; ++i) {
                    token = token + nums[Math.floor(Math.random() * nums.length)];
                }

                const result = yield self.models.token.findOne({token: token}),
                    data = {
                        token: token,
                        ticket: ticket.ticket
                    };

                return (result) ? create() : data;
            }).then(function (result) {
                const data = new self.models.token(result);
                data.save().then(function () {
                    callback(null, data.token);
                }).catch(function (error) {
                    callback(error);
                });
            }).catch(function (error) {
                callback(error);
            });
        });
    }


    /**
     * Exchange token
     *
     * @param {string} token
     * @param {Function} callback
     */
    exchangeToken(token, callback) {
        const self = this;
        co(function* () {
            return yield self.models.token.findOne({token: token});
        }).then(function (result) {
            if (result) {
                callback(null, result.ticket);
            } else {
                callback(new Error('Wrong token'));
            }
        });
    }


    /**
     * Return middleware function
     *
     * @param   {Object} options
     * @returns {Function}
     */
    middleware(options) {
        options = options || {};

        const self = this,
            header = options.header || 'X-Eq-Session',
            columns = options.columns || [];

        return function (req, res, next) {
            const ticket = req.get(header);
            if (!ticket) {
                return next();
            }

            self.getTicketSession(ticket, columns, function (error, result) {
                if (error) {
                    return next(error);
                }

                if (result) {
                    req.ticket = ticket;
                    req.session = result;
                }

                next();
            });
        };
    }
}


// Export module
module.exports = function (connection, config) {
    return new EqSession(connection, config);
};



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
