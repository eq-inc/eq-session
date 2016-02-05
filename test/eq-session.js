/* vim: set expandtab tabstop=4 shiftwidth=4 softtabstop=4: */
/*jslint node: true */
/*global before, describe, it */
'use strict';


// Variables
let session;
const util = require('util'),
    _ = require('lodash'),
    async = require('neo-async'),
    expect = require('expect.js'),
    mongoose = require('mongoose'),
    eq_session = require('../'),
    host = 'localhost',
    port = 27017;


// Before
before(function () {
    mongoose.connect(util.format('mongodb://%s:%d/eq-session', host, port));
    session = eq_session(mongoose.connection);
});


// Test
describe('EqSession', function () {
    describe('createTicket', function () {
        it('Should create ticket ', function (done) {
            const id = 'TEST_ID_010';

            async.waterfall([
                // Create ticket
                function (done) {
                    session.createTicket(id, done);
                },

                // Check ticket
                function (ticket, done) {
                    expect(new Buffer(ticket, 'base64')).to.have.length(32);

                    done(null, ticket);
                },

                // Get ticket data
                function (ticket, done) {
                    session.models.ticket.findOne({ticket: ticket}, function (error, result) {
                        if (error) {
                            return done(error);
                        }

                        done(null, ticket, result);
                    });
                },

                // Check ticket data
                function (ticket, result, done) {
                    expect(ticket).to.be(result.ticket);
                    expect(id).to.be(result.data.id);

                    done();
                }
            ], done);
        });
    });


    describe('getId', function () {
        it('Should get id by ticket', function (done) {
            const id = 'TEST_ID_020';

            async.waterfall([
                // Create ticket
                function (done) {
                    session.createTicket(id, done);
                },

                // Get ID
                function (ticket, done) {
                    session.getId(ticket, done);
                },

                // Check ID
                function (result, done) {
                    expect(result).to.be(id);

                    done();
                }
            ], done);
        });
    });


    describe('setSession', function () {
        it('Should store session data', function (done) {
            const id = 'TEST_ID_030',
                data = {key: 'value'};

            async.waterfall([
                // Store session data
                function (done) {
                    session.setSession(id, data, done);
                },

                // Get stored data
                function (result, done) {
                    session.models.store.findOne({id: id}, done);
                },

                // Check stored data
                function (result, done) {
                    expect(result.data).to.eql(data);

                    done();
                }
            ], done);
        });

        it('Should overwrite session data', function (done) {
            const id = 'TEST_ID_031',
                data1 = {key1: 'value1'},
                data2 = {key2: 'value2'};

            async.waterfall([
                // Store session data
                function (done) {
                    session.setSession(id, data1, done);
                },

                // Overwrite session data
                function (result, done) {
                    session.setSession(id, data2, done);
                },

                // Get stored data
                function (result, done) {
                    session.models.store.findOne({id: id}, done);
                },

                // Check stored data
                function (result, done) {
                    expect(result.data).to.eql(data2);

                    done();
                }
            ], done);
        });
    });


    describe('getSession', function () {
        describe('Should get session data', function () {
            it('Column specified', function (done) {
                const id = 'TEST_ID_040',
                    data = {
                        key1: 'value1',
                        key2: 'value2'
                    };

                async.waterfall([
                    // Set session data
                    function (done) {
                        session.setSession(id, data, done);
                    },

                    // Get session data
                    function (result, done) {
                        session.getSession(id, ['key2'], done);
                    },

                    // Check session data
                    function (result, done) {
                        expect(result).to.eql(_.pick(data, ['key2']));

                        done();
                    }
                ], done);
            });

            it('No column specified', function (done) {
                const id = 'TEST_ID_040',
                    data = {
                        key1: 'value1',
                        key2: 'value2'
                    };

                async.waterfall([
                    // Set session data
                    function (done) {
                        session.setSession(id, data, done);
                    },

                    // Get session data
                    function (result, done) {
                        session.getSession(id, done);
                    },

                    // Check session data
                    function (result, done) {
                        expect(result).to.eql(data);

                        done();
                    }
                ], done);
            });

        });
    });


    describe('getTicketSession', function () {
        describe('Should get session data', function () {
            it('No columns specified', function (done) {
                const id = 'TEST_ID_050',
                    data = {
                        key1: 'value1',
                        key2: 'value2'
                    };

                async.waterfall([
                    // Set session data
                    function (done) {
                        session.setSession(id, data, done);
                    },

                    // Create ticket
                    function (result, done) {
                        session.createTicket(id, done);
                    },

                    // Get session data
                    function (ticket, done) {
                        data.id = ticket;
                        session.getTicketSession(ticket, done);
                    },

                    // Check session data
                    function (result, done) {
                        expect(result).to.eql(data);

                        done();
                    }
                ], done);
            });

            it('Columns specified', function (done) {
                const id = 'TEST_ID_051',
                    data = {
                        key1: 'value1',
                        key2: 'value2'
                    };

                async.waterfall([
                    // Set session data
                    function (done) {
                        session.setSession(id, data, done);
                    },

                    // Create ticket
                    function (result, done) {
                        session.createTicket(id, done);
                    },

                    // Get session data
                    function (ticket, done) {
                        data.id = ticket;
                        session.getTicketSession(ticket, ['key2'], done);
                    },

                    // Check session data
                    function (result, done) {
                        expect(result).to.eql(_.pick(data, ['id', 'key2']));

                        done();
                    }
                ], done);
            });
        });
    });


    describe('Create token', function () {
        it('Should create token', function (done) {
            const id = 'TEST_ID_060';

            async.waterfall([
                // Create ticket
                function (done) {
                    session.createTicket(id, done);
                },

                // Create token
                function (ticket, done) {
                    session.createToken(ticket, done);
                },

                // Check token
                function (result, done) {
                    expect(result).to.match(/[A-z0-9]{8}/);

                    done();
                }
            ], done);
        });

        it('Should not create token', function (done) {
            session.createToken('TOKEN_NOT_FOUND', function (error) {
                expect(error.message).to.be('Wrong ticket');

                done();
            });
        });
    });


    describe('exchangeToken', function () {
        it('Should exchange token', function (done) {
            const id = 'TEST_ID_070';

            async.waterfall([
                // Create ticket
                function (done) {
                    session.createTicket(id, done);
                },

                // Create token
                function (ticket, done) {
                    session.createToken(ticket, function (error, result) {
                        if (error) {
                            done(error);
                        } else {
                            done(null, ticket, result);
                        }
                    });
                },

                // Exchange token
                function (ticket, token, done) {
                    session.exchangeToken(token, function (error, result) {
                        if (error) {
                            done(error);
                        } else {
                            done(null, ticket, result);
                        }
                    });
                },

                // Check ticket
                function (ticket, result, done) {
                    expect(result).to.be(ticket);

                    done();
                }
            ], done);
        });

        it('Should not exchange token', function (done) {
            session.exchangeToken('TOKEN_NOT_FOUND', function (error) {
                expect(error.message).to.be('Wrong token');

                done();
            });
        });
    });


    describe('middleware', function () {
        it('Should get middleware function', function () {
            expect(session.middleware()).to.be.a(Function);
        });
    });
});



/*
 * Local variables:
 * tab-width: 4
 * c-basic-offset: 4
 * c-hanging-comment-ender-p: nil
 * End:
 */
