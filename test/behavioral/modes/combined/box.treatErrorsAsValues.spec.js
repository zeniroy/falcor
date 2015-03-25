var jsong = require("../../../../index");
var Model = jsong.Model;
var Rx = require("rx");
var LocalDataSource = require("../../../data/LocalDataSource");
var Cache = require("../../../data/Cache");
var ReducedCache = require("../../../data/ReducedCache");
var Expected = require("../../../data/expected");
var getTestRunner = require("../../../getTestRunner");
var testRunner = require("../../../testRunner");
var Bound = Expected.Bound;
var chai = require("chai");
var expect = chai.expect;
var noOp = function() {};
var _ = require('lodash');

describe('Box and treatErrorsAsValues', function() {
    it('should get an error as value.', function(done) {
        var model = new Model({cache: Cache()}).boxValues().treatErrorsAsValues();
        model.
            get(['videos', 'errorBranch']).
            do(function(video) {
                var summary = video.json.videos.errorBranch;
                expect(summary.message).to.equal('I am yelling timber.');
                expect(summary.$type).to.equal('error');
            }).
            subscribe(noOp, done, done);
    });
});
